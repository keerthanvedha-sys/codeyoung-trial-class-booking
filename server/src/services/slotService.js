import prisma from '../db/prisma.js';
import { generateDaySlotsForParent, getMentorLocalDayRange, isWithinMentorWorkingHours } from './timezoneService.js';
import { CONFIG } from '../config/constants.js';

export class SlotService {
  /**
   * Dynamically generates and assesses availability for slots on a given parent-local date.
   * Optimized with bulk fetching to eliminate the N+1 query problem (2 queries instead of 500+).
   * 
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @param {string} timezone - Parent IANA timezone
   * @returns {Promise<object>}
   */
  async getAvailableSlots(dateStr, timezone) {
    const rawSlots = generateDaySlotsForParent(
      dateStr,
      timezone,
      CONFIG.TRIAL_DURATION_MINUTES,
      CONFIG.PARENT_SLOT_START_HOUR,
      CONFIG.PARENT_SLOT_END_HOUR
    );

    if (rawSlots.length === 0) {
      return {
        date: dateStr,
        parentTimezone: timezone,
        trialDurationMinutes: CONFIG.TRIAL_DURATION_MINUTES,
        totalSlots: 0,
        availableSlotsCount: 0,
        isFullyBooked: true,
        slots: [],
      };
    }

    const nowUTC = new Date();

    // Determine the complete UTC span covering all slots
    const earliestSlotStartUTC = rawSlots[0].startTimeUTC;
    const latestSlotEndUTC = rawSlots[rawSlots.length - 1].endTimeUTC;

    // Buffer range by 24 hours in both directions to safely encompass mentor local calendar days (Asia/Kolkata)
    const windowStartUTC = new Date(earliestSlotStartUTC.getTime() - 24 * 60 * 60 * 1000);
    const windowEndUTC = new Date(latestSlotEndUTC.getTime() + 24 * 60 * 60 * 1000);

    // 1. Bulk Query: Fetch all active mentors in a single query
    const activeMentors = await prisma.mentor.findMany({
      where: { active: true },
    });

    // 2. Bulk Query: Fetch all confirmed bookings within the buffered window in a single query
    const existingBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        startTimeUTC: { gte: windowStartUTC, lte: windowEndUTC },
      },
    });

    const evaluatedSlots = [];
    let availableCount = 0;

    for (const slot of rawSlots) {
      // Check if slot is in the past
      const isPast = slot.startTimeUTC < nowUTC;

      if (isPast) {
        evaluatedSlots.push({
          ...slot,
          available: false,
          availableMentorsCount: 0,
          reason: 'PAST_TIME',
          userMessage: 'This time has already passed.',
        });
        continue;
      }

      // In-memory evaluation of eligible mentors for this exact slot
      let eligibleMentorsCount = 0;

      for (const mentor of activeMentors) {
        // A. Working hours check (in mentor's local timezone)
        const inWorkingHours = isWithinMentorWorkingHours(
          slot.startTimeUTC,
          slot.endTimeUTC,
          mentor.timezone,
          mentor.workStartHour,
          mentor.workEndHour
        );
        if (!inWorkingHours) continue;

        // B. Check mentor's daily limit on their local day
        const { startUTC, endUTC } = getMentorLocalDayRange(slot.startTimeUTC, mentor.timezone);

        const mentorDayBookingsCount = existingBookings.filter(
          (b) =>
            b.mentorId === mentor.id &&
            b.startTimeUTC >= startUTC &&
            b.startTimeUTC <= endUTC
        ).length;

        if (mentorDayBookingsCount >= CONFIG.MAX_CLASSES_PER_MENTOR_PER_DAY) {
          continue; // Mentor at daily capacity on their local calendar date
        }

        // C. Check overlapping booking
        const hasOverlap = existingBookings.some(
          (b) =>
            b.mentorId === mentor.id &&
            b.startTimeUTC < slot.endTimeUTC &&
            b.endTimeUTC > slot.startTimeUTC
        );

        if (hasOverlap) {
          continue; // Mentor is busy during this slot
        }

        eligibleMentorsCount++;
      }

      const isAvailable = eligibleMentorsCount > 0;
      if (isAvailable) {
        availableCount++;
      }

      evaluatedSlots.push({
        ...slot,
        available: isAvailable,
        availableMentorsCount: eligibleMentorsCount,
        reason: isAvailable ? 'AVAILABLE' : 'NO_MENTOR_AVAILABLE',
        userMessage: isAvailable ? 'Available' : 'All mentors are booked or unavailable at this time.',
      });
    }

    return {
      date: dateStr,
      parentTimezone: timezone,
      trialDurationMinutes: CONFIG.TRIAL_DURATION_MINUTES,
      totalSlots: evaluatedSlots.length,
      availableSlotsCount: availableCount,
      isFullyBooked: availableCount === 0,
      slots: evaluatedSlots,
    };
  }
}

export const slotService = new SlotService();
export default slotService;
