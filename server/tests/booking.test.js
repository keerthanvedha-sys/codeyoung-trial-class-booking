import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import prisma from '../src/db/prisma.js';
import bookingService from '../src/services/bookingService.js';
import { seedMentors } from '../prisma/seed.js';

describe('Booking Service Integration Tests', () => {
  beforeAll(async () => {
    await seedMentors();
  });

  beforeEach(async () => {
    await prisma.mentor.updateMany({ data: { active: true } });
    await bookingService.clearAllBookings();
  });

  it('successfully creates a trial booking and returns localized times and meeting link', async () => {
    // Slot in future (e.g. 2026-10-20 at 10:00 AM EDT)
    // 10:00 AM EDT is 14:00 UTC, which is 7:30 PM IST in mentor timezone (within 9am-9pm IST working hours!)
    const payload = {
      parentName: 'John Doe',
      parentEmail: 'john.doe@example.com',
      parentTimezone: 'America/New_York',
      slotDate: '2026-10-20',
      slotTime: '10:00',
    };

    const confirmation = await bookingService.createBooking(payload);

    expect(confirmation.success).toBe(true);
    expect(confirmation.bookingId).toBeDefined();
    expect(confirmation.meetingLink).toMatch(/^https:\/\/meet\.codeyoung\.com\/trial-[a-f0-9]+$/);
    expect(confirmation.mentor.name).toBeDefined();

    // Timezone checks
    expect(confirmation.times.parent.timeZoneAbbr).toBe('EDT');
    expect(confirmation.times.parent.startTime).toBe('10:00 AM');
    expect(confirmation.times.mentor.timeZoneAbbr).toBe('IST');
    expect(confirmation.times.mentor.startTime).toBe('07:30 PM');

    // Verify UTC persistence in database
    const dbRecord = await prisma.booking.findUnique({
      where: { id: confirmation.bookingId },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord.startTimeUTC.toISOString()).toBe('2026-10-20T14:00:00.000Z');
    expect(dbRecord.endTimeUTC.toISOString()).toBe('2026-10-20T14:30:00.000Z');
    expect(dbRecord.status).toBe('CONFIRMED');
  });

  it('strictly rejects booking a slot in the past', async () => {
    const pastPayload = {
      parentName: 'Past Parent',
      parentEmail: 'past.parent@example.com',
      parentTimezone: 'America/New_York',
      slotDate: '2020-01-15',
      slotTime: '10:00',
    };

    await expect(bookingService.createBooking(pastPayload)).rejects.toThrow(
      /Cannot book an appointment slot that has already passed/
    );
  });

  it('rejects invalid IANA timezone', async () => {
    const invalidTzPayload = {
      parentName: 'Invalid TZ',
      parentEmail: 'tz@example.com',
      parentTimezone: 'Not_A_Timezone',
      slotDate: '2026-10-20',
      slotTime: '10:00',
    };

    await expect(bookingService.createBooking(invalidTzPayload)).rejects.toThrow(
      /Invalid IANA timezone/
    );
  });

  it('prevents mentor overlapping bookings', async () => {
    // Book 10 parents at the exact same slot (all 10 mentors become occupied at this slot)
    const slotDate = '2026-10-22';
    const slotTime = '10:00'; // 14:00 UTC

    for (let i = 1; i <= 10; i++) {
      await bookingService.createBooking({
        parentName: `Parent ${i}`,
        parentEmail: `parent${i}@example.com`,
        parentTimezone: 'America/New_York',
        slotDate,
        slotTime,
      });
    }

    // Attempting an 11th booking at the exact same slot must fail because all 10 mentors have an overlapping booking
    await expect(
      bookingService.createBooking({
        parentName: 'Parent 11',
        parentEmail: 'parent11@example.com',
        parentTimezone: 'America/New_York',
        slotDate,
        slotTime,
      })
    ).rejects.toThrow(/That slot was just booked by another parent or no mentor is available/);
  });
});
