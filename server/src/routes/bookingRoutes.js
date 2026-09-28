import express from 'express';
import { createBookingHandler, getBookingHandler, clearBookingsHandler } from '../controllers/bookingController.js';
import { validateBody, createBookingSchema } from '../middleware/validator.js';

const router = express.Router();

// POST /api/bookings
router.post('/', validateBody(createBookingSchema), createBookingHandler);

// GET /api/bookings/:id
router.get('/:id', getBookingHandler);

// POST /api/bookings/reset (Demo helper)
router.post('/reset', clearBookingsHandler);

export default router;
