import express from 'express';
import { getSlotsHandler } from '../controllers/slotController.js';
import { validateQuery, getSlotsSchema } from '../middleware/validator.js';

const router = express.Router();

// GET /api/slots?date=YYYY-MM-DD&timezone=America/New_York
router.get('/', validateQuery(getSlotsSchema), getSlotsHandler);

export default router;
