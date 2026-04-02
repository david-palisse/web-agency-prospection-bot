import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

function slugifyCity(city) {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export async function writeProspectsToCsv(city, prospects) {
  const exportsDirectory = path.resolve(process.cwd(), 'exports');
  await fs.mkdir(exportsDirectory, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `prospection-${slugifyCity(city) || 'ville'}-${timestamp}.csv`;
  const filePath = path.join(exportsDirectory, fileName);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'businessName', title: 'nom du commerce' },
      { id: 'businessType', title: 'type de commerce' },
      { id: 'address', title: 'adresse du commerce' },
      { id: 'averageRating', title: 'note moyenne des avis' },
      { id: 'email', title: 'adresse mail' },
      { id: 'phoneNumber', title: 'numéro de téléphone' }
    ]
  });

  await csvWriter.writeRecords(prospects);

  return {
    fileName,
    absolutePath: filePath,
    relativePath: path.posix.join('exports', fileName)
  };
}
