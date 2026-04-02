import { Router } from 'express';
import { exportBusinessesWithoutWebsite } from '../controllers/prospectionController.js';

const router = Router();

router.post('/export', exportBusinessesWithoutWebsite);

export default router;
