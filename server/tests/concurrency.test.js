import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import prisma from '../src/db/prisma.js';
import bookingService from '../src/services/bookingService.js';
import { seedMentors } from '../prisma/seed.js';

describe('Concurrency & Race Condition Prevention', () => {
  beforeAll(async () => {
    await seedMentors();
  });

  beforeEach(async () => {
    await prisma.mentor.updateMany({ data: { active: true } });
    await bookingService.clearAllBookings();
  });

  afterEach(async () => {
    await prisma.mentor.updateMany({ data: { active: true } });
  });

  it('handles race conditions when multiple parents compete for the final available mentor', async () => {
    // Leave only 1 mentor active
    const mentors = await prisma.mentor.findMany({ where: { active: true } });
    const singleMentor = mentors[0];

    await prisma.mentor.updateMany({
      where: { id: { not: singleMentor.id } },
      data: { active: false },
    });

    // Both parents attempt to book the exact same slot at the exact same moment
    const slotDate = '2026-10-30';
    const slotTime = '10:00';

    const p1 = bookingService.createBooking({
      parentName: 'Competitor One',
      parentEmail: 'comp1@example.com',
      parentTimezone: 'America/New_York',
      slotDate,
      slotTime,
    });

    const p2 = bookingService.createBooking({
      parentName: 'Competitor Two',
      parentEmail: 'comp2@example.com',
      parentTimezone: 'America/New_York',
      slotDate,
      slotTime,
    });

    const results = await Promise.allSettled([p1, p2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one should succeed, and exactly one should receive availability error
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toMatch(/That slot was just booked by another parent/);

    // Verify database has exactly 1 booking for this slot
    const count = await prisma.booking.count({
      where: { status: 'CONFIRMED' },
    });
    expect(count).toBe(1);
  });
});
