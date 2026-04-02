import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import prospectionRoutes from './routes/prospectionRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectory = path.resolve(__dirname, '../public');
const exportsDirectory = path.resolve(__dirname, '../exports');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDirectory));
app.use('/exports', express.static(exportsDirectory));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/prospection', prospectionRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(error.statusCode ?? 500).json({
    error: error.message ?? 'Une erreur inattendue est survenue.'
  });
});

export default app;
