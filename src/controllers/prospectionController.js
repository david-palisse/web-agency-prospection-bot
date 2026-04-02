import { findBusinessesWithoutWebsite } from '../services/googlePlacesService.js';
import { writeProspectsToCsv } from '../services/csvExportService.js';

export async function exportBusinessesWithoutWebsite(req, res, next) {
  try {
    const city = req.body.city?.trim();

    if (!city) {
      return res.status(400).json({
        error: 'Le champ "city" est obligatoire.'
      });
    }

    const maxPagesPerCategory = Number.parseInt(
      req.body.maxPagesPerCategory ?? process.env.MAX_PAGES_PER_CATEGORY ?? '3',
      10
    );

    const { prospects, metadata } = await findBusinessesWithoutWebsite(city, {
      maxPagesPerCategory
    });

    const csvFile = await writeProspectsToCsv(city, prospects);

    return res.status(200).json({
      city,
      scannedBusinesses: metadata.scannedBusinesses,
      exportedBusinesses: prospects.length,
      fileName: csvFile.fileName,
      filePath: csvFile.relativePath,
      downloadUrl: `/${csvFile.relativePath}`,
      limitations: [
        'Google Places API ne fournit généralement pas les adresses e-mail des commerces : la colonne reste donc vide si aucune donnée n\'est disponible.'
      ]
    });
  } catch (error) {
    next(error);
  }
}
