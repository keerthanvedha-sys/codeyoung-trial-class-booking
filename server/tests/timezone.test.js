import { describe, it, expect } from 'vitest';
import {
  isValidTimezone,
  parseLocalToUTC,
  formatInTimezone,
  getMentorLocalDayRange,
  isWithinMentorWorkingHours,
} from '../src/services/timezoneService.js';
import { DateTime } from 'luxon';

describe('Timezone & DST Service', () => {
  describe('isValidTimezone', () => {
    it('accepts valid IANA timezone names', () => {
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Asia/Kolkata')).toBe(true);
      expect(isValidTimezone('America/Los_Angeles')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('rejects invalid or malformed timezone names', () => {
      expect(isValidTimezone('Mars/Olympus')).toBe(false);
      expect(isValidTimezone('US/Eastern_Fake')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone(null)).toBe(false);
    });
  });

  describe('Daylight Saving Time (DST) Handling', () => {
    it('correctly identifies EDT (UTC-4) in Summer for America/New_York', () => {
      // July 15: Summer (EDT active)
      const parsedSummer = parseLocalToUTC('2026-07-15', '10:00', 'America/New_York');
      const formattedSummer = formatInTimezone(parsedSummer.utcDate, 'America/New_York');

      expect(formattedSummer.timeZoneAbbr).toBe('EDT');
      expect(formattedSummer.isInDST).toBe(true);
      expect(formattedSummer.offsetMinutes).toBe(-240); // -4 hours
      // 10:00 AM EDT is 14:00 UTC
      expect(parsedSummer.utcIso).toContain('T14:00:00.000Z');
    });

    it('correctly identifies EST (UTC-5) in Winter for America/New_York', () => {
      // January 15: Winter (Standard time EST)
      const parsedWinter = parseLocalToUTC('2026-01-15', '10:00', 'America/New_York');
      const formattedWinter = formatInTimezone(parsedWinter.utcDate, 'America/New_York');

      expect(formattedWinter.timeZoneAbbr).toBe('EST');
      expect(formattedWinter.isInDST).toBe(false);
      expect(formattedWinter.offsetMinutes).toBe(-300); // -5 hours
      // 10:00 AM EST is 15:00 UTC
      expect(parsedWinter.utcIso).toContain('T15:00:00.000Z');
    });

    it('correctly handles UK transitions between BST (UTC+1) and GMT (UTC+0)', () => {
      // August (BST)
      const bst = parseLocalToUTC('2026-08-10', '14:00', 'Europe/London');
      const formattedBst = formatInTimezone(bst.utcDate, 'Europe/London');
      expect(formattedBst.timeZoneAbbr).toBe('BST');
      expect(formattedBst.isInDST).toBe(true);
      expect(formattedBst.offsetMinutes).toBe(60); // +1 hour

      // December (GMT)
      const gmt = parseLocalToUTC('2026-12-10', '14:00', 'Europe/London');
      const formattedGmt = formatInTimezone(gmt.utcDate, 'Europe/London');
      expect(formattedGmt.timeZoneAbbr).toBe('GMT');
      expect(formattedGmt.isInDST).toBe(false);
      expect(formattedGmt.offsetMinutes).toBe(0);
    });

    it('handles non-DST regions like Asia/Kolkata (always IST UTC+5:30)', () => {
      const summer = parseLocalToUTC('2026-06-15', '10:00', 'Asia/Kolkata');
      const winter = parseLocalToUTC('2026-12-15', '10:00', 'Asia/Kolkata');

      const formatSummer = formatInTimezone(summer.utcDate, 'Asia/Kolkata');
      const formatWinter = formatInTimezone(winter.utcDate, 'Asia/Kolkata');

      expect(formatSummer.timeZoneAbbr).toBe('IST');
      expect(formatWinter.timeZoneAbbr).toBe('IST');
      expect(formatSummer.isInDST).toBe(false);
      expect(formatWinter.isInDST).toBe(false);
      expect(formatSummer.offsetMinutes).toBe(330); // 5h 30m
      expect(formatWinter.offsetMinutes).toBe(330);
    });
  });

  describe('Mentor Local Day Range Computation', () => {
    it('evaluates calendar day bounds strictly against the mentor local timezone, not UTC date', () => {
      // Suppose an appointment is booked at 2026-10-15 20:00 UTC.
      // In UTC, this is 2026-10-15.
      // But in Asia/Kolkata (+5:30), 20:00 UTC is 01:30 AM on 2026-10-16 (the NEXT DAY!).
      const apptUTC = new Date('2026-10-15T20:00:00.000Z');
      const range = getMentorLocalDayRange(apptUTC, 'Asia/Kolkata');

      expect(range.mentorLocalDate).toBe('2026-10-16');

      // The mentor's local day starts at 2026-10-16 00:00:00 IST -> which in UTC is 2026-10-15 18:30:00 UTC
      const startRangeLuxon = DateTime.fromJSDate(range.startUTC).toUTC();
      expect(startRangeLuxon.toISO()).toContain('2026-10-15T18:30:00');

      // The mentor's local day ends at 2026-10-16 23:59:59.999 IST -> which in UTC is 2026-10-16 18:29:59.999 UTC
      const endRangeLuxon = DateTime.fromJSDate(range.endUTC).toUTC();
      expect(endRangeLuxon.toISO()).toContain('2026-10-16T18:29:59');
    });
  });

  describe('Mentor Working Hours Check', () => {
    it('accepts slot within mentor working hours in mentor local time', () => {
      // 10:00 AM IST (which is 04:30 AM UTC)
      const slotStartUTC = new Date('2026-10-15T04:30:00.000Z');
      const slotEndUTC = new Date('2026-10-15T05:00:00.000Z');

      const isInside = isWithinMentorWorkingHours(slotStartUTC, slotEndUTC, 'Asia/Kolkata', 9, 21);
      expect(isInside).toBe(true);
    });

    it('rejects slot outside mentor working hours in mentor local time', () => {
      // 03:00 AM IST (which is 21:30 UTC previous day)
      const slotStartUTC = new Date('2026-10-15T21:30:00.000Z');
      const slotEndUTC = new Date('2026-10-15T22:00:00.000Z');

      const isInside = isWithinMentorWorkingHours(slotStartUTC, slotEndUTC, 'Asia/Kolkata', 9, 21);
      expect(isInside).toBe(false);
    });
  });
});
