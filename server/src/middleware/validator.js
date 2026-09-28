import { z } from 'zod';
import { isValidTimezone } from '../services/timezoneService.js';

export const getSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  timezone: z.string().refine((tz) => isValidTimezone(tz), {
    message: 'Invalid IANA timezone identifier (e.g. America/New_York, Europe/London, Asia/Kolkata)',
  }),
});

export const createBookingSchema = z.object({
  parentName: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
  parentEmail: z.string().trim().email('Please enter a valid email address'),
  parentTimezone: z.string().refine((tz) => isValidTimezone(tz), {
    message: 'Invalid IANA timezone identifier (e.g. America/New_York, Europe/London, Asia/Kolkata)',
  }),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
  slotTime: z.string().optional(),
  startTimeUTC: z.string().datetime().optional(),
}).refine((data) => (data.slotDate && data.slotTime) || data.startTimeUTC, {
  message: 'Must provide either (slotDate and slotTime) or a valid startTimeUTC',
});

/**
 * Middleware factory for validating request queries
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: err.errors[0]?.message || 'Validation failed on query parameters',
          details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
}

/**
 * Middleware factory for validating request body
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: err.errors[0]?.message || 'Validation failed on request body',
          details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
}
