import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/db/prisma.js';
import bookingService from '../src/services/bookingService.js';
import { seedMentors } from '../prisma/seed.js';

describe('HTTP API Endpoints', () => {
  beforeAll(async () => {
    await seedMentors();
  });

  beforeEach(async () => {
    await prisma.mentor.updateMany({ data: { active: true } });
    await bookingService.clearAllBookings();
  });

  describe('GET /api/health', () => {
    it('returns 200 OK with service status and UTC timestamp', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('codeyoung-booking-api');
      expect(res.body.timestampUTC).toBeDefined();
    });
  });

  describe('GET /api/slots', () => {
    it('returns dynamic 30-minute slots for valid date and timezone', async () => {
      const res = await request(app)
        .get('/api/slots')
        .query({ date: '2026-10-15', timezone: 'America/New_York' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slots).toBeInstanceOf(Array);
      expect(res.body.data.slots.length).toBeGreaterThan(0);
      expect(res.body.data.date).toBe('2026-10-15');
      expect(res.body.data.parentTimezone).toBe('America/New_York');

      const sampleSlot = res.body.data.slots[0];
      expect(sampleSlot.localTime).toBeDefined();
      expect(sampleSlot.startTimeUTC).toBeDefined();
      expect(sampleSlot.available).toBeDefined();
    });

    it('returns 400 when date format is invalid', async () => {
      const res = await request(app)
        .get('/api/slots')
        .query({ date: '15-10-2026', timezone: 'America/New_York' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Date must be formatted as YYYY-MM-DD');
    });

    it('returns 400 when timezone is invalid', async () => {
      const res = await request(app)
        .get('/api/slots')
        .query({ date: '2026-10-15', timezone: 'Invalid/Zone' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid IANA timezone identifier');
    });
  });

  describe('POST /api/bookings', () => {
    it('creates a new booking and returns 201 Created with confirmation payload', async () => {
      const payload = {
        parentName: 'Alice Smith',
        parentEmail: 'alice.smith@example.com',
        parentTimezone: 'Europe/London',
        slotDate: '2026-10-20',
        slotTime: '15:00',
      };

      const res = await request(app).post('/api/bookings').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingId).toBeDefined();
      expect(res.body.data.meetingLink).toContain('https://meet.codeyoung.com/trial-');
      expect(res.body.data.mentor.name).toBeDefined();
      expect(res.body.data.times.parent.timeZoneAbbr).toBe('BST');
      expect(res.body.data.times.mentor.timeZoneAbbr).toBe('IST');
    });

    it('returns 400 for invalid email address', async () => {
      const payload = {
        parentName: 'Alice',
        parentEmail: 'not-an-email',
        parentTimezone: 'Europe/London',
        slotDate: '2026-10-20',
        slotTime: '15:00',
      };

      const res = await request(app).post('/api/bookings').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('valid email address');
    });
  });

  describe('GET /api/mentors', () => {
    it('returns list of mentors with today stats and daily limits', async () => {
      const res = await request(app).get('/api/mentors');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(10);

      const firstMentor = res.body.data[0];
      expect(firstMentor.name).toBeDefined();
      expect(firstMentor.maxDailyCapacity).toBe(2);
      expect(firstMentor.todayBookingCount).toBeDefined();
    });
  });
});
