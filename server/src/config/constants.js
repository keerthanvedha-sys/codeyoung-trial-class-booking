import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  
  // Trial Class Business Rules
  TRIAL_DURATION_MINUTES: parseInt(process.env.TRIAL_DURATION_MINUTES || '30', 10),
  MAX_CLASSES_PER_MENTOR_PER_DAY: parseInt(process.env.MAX_CLASSES_PER_MENTOR_PER_DAY || '2', 10),
  MAX_TOTAL_BOOKINGS_PER_DAY: parseInt(process.env.MAX_TOTAL_BOOKINGS_PER_DAY || '20', 10),
  
  // Mentor Working Hours (in mentor's local timezone)
  DEFAULT_MENTOR_WORK_START_HOUR: parseInt(process.env.MENTOR_WORK_START_HOUR || '9', 10),
  DEFAULT_MENTOR_WORK_END_HOUR: parseInt(process.env.MENTOR_WORK_END_HOUR || '21', 10),

  // Slots generation window (parent local time window to offer slots)
  PARENT_SLOT_START_HOUR: 8,  // 8:00 AM parent local time
  PARENT_SLOT_END_HOUR: 22,   // 10:00 PM parent local time
  SLOT_INTERVAL_MINUTES: 30,

  // Booking buffers
  MIN_ADVANCE_BOOKING_MINUTES: 0, // Past slots rejected strictly
};
