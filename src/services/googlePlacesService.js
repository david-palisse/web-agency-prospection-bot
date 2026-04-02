import axios from 'axios';
import { SEARCH_CATEGORIES } from '../config/categories.js';

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';
const DEFAULT_PAGE_SIZE = Number.parseInt(process.env.GOOGLE_PAGE_SIZE ?? '20', 10);
const DEFAULT_CONCURRENCY = Number.parseInt(process.env.DETAILS_CONCURRENCY ?? '5', 10);

const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.types',
  'places.rating',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'nextPageToken'
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'primaryType',
  'primaryTypeDisplayName',
  'types',
  'rating',
  'websiteUri',
  'nationalPhoneNumber'
].join(',');

function getApiKey() {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    const error = new Error('La variable d\'environnement GOOGLE_MAPS_API_KEY est manquante.');
    error.statusCode = 500;
    throw error;
  }

  return process.env.GOOGLE_MAPS_API_KEY;
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function normalizeBusinessType(place) {
  if (place.primaryTypeDisplayName?.text) {
    return place.primaryTypeDisplayName.text;
  }

  if (place.primaryType) {
    return place.primaryType.replace(/_/g, ' ');
  }

  if (Array.isArray(place.types) && place.types.length > 0) {
    return place.types[0].replace(/_/g, ' ');
  }

  return 'Non renseigné';
}

function buildProspect(place) {
  return {
    businessName: place.displayName?.text ?? 'Nom non renseigné',
    businessType: normalizeBusinessType(place),
    address: place.formattedAddress ?? 'Adresse non renseignée',
    averageRating: place.rating ?? '',
    email: '',
    phoneNumber: place.nationalPhoneNumber ?? ''
  };
}

async function searchText(query, pageToken) {
  const response = await axios.post(
    `${GOOGLE_PLACES_BASE_URL}/places:searchText`,
    {
      textQuery: query,
      languageCode: 'fr',
      pageSize: DEFAULT_PAGE_SIZE,
      ...(pageToken ? { pageToken } : {})
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getApiKey(),
        'X-Goog-FieldMask': SEARCH_FIELD_MASK
      }
    }
  );

  return {
    places: response.data.places ?? [],
    nextPageToken: response.data.nextPageToken ?? null
  };
}

async function getPlaceDetails(placeId) {
  const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': DETAILS_FIELD_MASK
    }
  });

  return response.data;
}

async function processInBatches(items, batchSize, handler) {
  const results = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const batchResults = await Promise.allSettled(batch.map(handler));

    results.push(...batchResults);
  }

  return results;
}

export async function findBusinessesWithoutWebsite(city, options = {}) {
  const maxPagesPerCategory = Number.isFinite(options.maxPagesPerCategory)
    ? options.maxPagesPerCategory
    : Number.parseInt(process.env.MAX_PAGES_PER_CATEGORY ?? '3', 10);

  const uniquePlaces = new Map();

  for (const category of SEARCH_CATEGORIES) {
    let pageToken = null;

    for (let page = 0; page < maxPagesPerCategory; page += 1) {
      const query = `${category} à ${city}`;
      const { places, nextPageToken } = await searchText(query, pageToken);

      for (const place of places) {
        if (place.id && !uniquePlaces.has(place.id)) {
          uniquePlaces.set(place.id, place);
        }
      }

      if (!nextPageToken) {
        break;
      }

      pageToken = nextPageToken;
      await sleep(1500);
    }
  }

  const detailResults = await processInBatches(
    [...uniquePlaces.keys()],
    DEFAULT_CONCURRENCY,
    async (placeId) => getPlaceDetails(placeId)
  );

  const prospects = detailResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .filter((place) => !place.websiteUri)
    .map(buildProspect)
    .sort((first, second) => first.businessName.localeCompare(second.businessName, 'fr'));

  return {
    prospects,
    metadata: {
      scannedBusinesses: uniquePlaces.size
    }
  };
}
