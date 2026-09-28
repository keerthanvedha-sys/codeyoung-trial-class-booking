import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import prisma from '../src/db/prisma.js';
import bookingService from '../src/services/bookingService.js';
import { seedMentors } from '../prisma/seed.js';

describe('Mentor Daily Limit & Allocation Strategy', () => {
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

  it('balances load by assigning mentors with fewest bookings first', async () => {
    // Slot 1: 10:00 AM NY (19:30 IST)
    const booking1 = await bookingService.createBooking({
      parentName: 'First Parent',
      parentEmail: 'first@example.com',
      parentTimezone: 'America/New_York',
      slotDate: '2026-10-25',
      slotTime: '10:00',
    });

    // Slot 2: 10:30 AM NY (20:00 IST)
    const booking2 = await bookingService.createBooking({
      parentName: 'Second Parent',
      parentEmail: 'second@example.com',
      parentTimezone: 'America/New_York',
      slotDate: '2026-10-25',
      slotTime: '10:30',
    });

    // Load balancer should assign booking2 to a DIFFERENT mentor since the first mentor now has 1 booking and the rest have 0!
    expect(booking1.mentor.id).not.toBe(booking2.mentor.id);
  });

  it('strictly limits each mentor to at most 2 classes on their local calendar day', async () => {
    // Select one specific mentor to test
    const allMentors = await prisma.mentor.findMany({ where: { active: true } });
    const testMentor = allMentors[0];

    // Deactivate all mentors except testMentor for this test to isolate single-mentor limit
    await prisma.mentor.updateMany({
      where: { id: { not: testMentor.id } },
      data: { active: false },
    });

    // Book 1st class for testMentor
    const b1 = await bookingService.createBooking({
      parentName: 'Parent A',
      parentEmail: 'parentA@example.com',
      parentTimezone: 'America/New_York',
      slotDate: '2026-10-26',
      slotTime: '09:00',
    });
    expect(b1.mentor.id).toBe(testMentor.id);

    // Book 2nd class for testMentor (different time on same day)
    const b2 = await bookingService.createBooking({
      parentName: 'Parent B',
      parentEmail: 'parentB@example.com',
      parentTimezone: 'America/New_York',
      slotDate: '2026-10-26',
      slotTime: '10:00',
    });
    expect(b2.mentor.id).toBe(testMentor.id);

    // Attempt 3rd class for testMentor on the same local day -> MUST FAIL
    await expect(
      bookingService.createBooking({
        parentName: 'Parent C',
        parentEmail: 'parentC@example.com',
        parentTimezone: 'America/New_York',
        slotDate: '2026-10-26',
        slotTime: '11:00',
      })
    ).rejects.toThrow(/That slot was just booked by another parent or no mentor is available/);
  });

  it('correctly tracks daily limit according to mentor local calendar date across midnight boundary', async () => {
    // An appointment at 11:30 PM (23:30) on 2026-10-27 in New York (EDT, UTC-4) is:
    // 03:30 UTC on 2026-10-28, which is 09:00 AM on 2026-10-28 in mentor's timezone (Asia/Kolkata).
    // The mentor's local date is 2026-10-28!
    const booking = await bookingService.createBooking({
      parentName: 'Late Parent',
      parentEmail: 'late@example.com',
      parentTimezone: 'America/New_York',
      slotDate: '2026-10-27',
      slotTime: '23:30',
    });

    expect(booking.times.parent.date).toContain('October 27');
    expect(booking.times.mentor.date).toContain('October 28');
  });
});
