import prisma from '../db/prisma.js';
import { getMentorLocalDayRange, isWithinMentorWorkingHours, formatInTimezone } from './timezoneService.js';
import { CONFIG } from '../config/constants.js';

export class MentorService {
  /**
   * Fetches all mentors with their current day stats for the demo/admin view.
   */
  async getAllMentorsWithStats() {
    const mentors = await prisma.mentor.findMany({
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
          include: { parent: true },
          orderBy: { startTimeUTC: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const nowUTC = new Date();

    return mentors.map((mentor) => {
      // Calculate mentor's current local day bounds
      const { startUTC, endUTC, mentorLocalDate } = getMentorLocalDayRange(nowUTC, mentor.timezone);
      const mentorLocalNow = formatInTimezone(nowUTC, mentor.timezone);

      const todayBookings = mentor.bookings.filter(
        (b) => b.startTimeUTC >= startUTC && b.startTimeUTC <= endUTC
      );

      return {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        timezone: mentor.timezone,
        active: mentor.active,
        workHours: `${mentor.workStartHour}:00 - ${mentor.workEndHour}:00 (${mentorLocalNow.timeZoneAbbr})`,
        localCurrentTime: `${mentorLocalNow.time} ${mentorLocalNow.timeZoneAbbr}`,
        todayLocalDate: mentorLocalDate,
        todayBookingCount: todayBookings.length,
        maxDailyCapacity: CONFIG.MAX_CLASSES_PER_MENTOR_PER_DAY,
        availableCapacity: Math.max(0, CONFIG.MAX_CLASSES_PER_MENTOR_PER_DAY - todayBookings.length),
        isAtDailyCapacity: todayBookings.length >= CONFIG.MAX_CLASSES_PER_MENTOR_PER_DAY,
        totalBookingsAllTime: mentor.bookings.length,
      };
    });
  }

  /**
   * Finds all eligible mentors for a specific slot.
   * Mentor is eligible if:
   * 1. mentor.active === true
   * 2. slot falls within mentor's working hours (in mentor's local timezone)
   * 3. mentor has < MAX_CLASSES_PER_MENTOR_PER_DAY on that local day
   * 4. mentor does NOT have an overlapping booking during [startTimeUTC, endTimeUTC]
   * 
   * @param {Date} startTimeUTC 
   * @param {Date} endTimeUTC 
   * @param {object} tx - optional Prisma transaction client
   * @returns {Promise<Array<{ mentor: object, todayCount: number }>>}
   */
  async findEligibleMentors(startTimeUTC, endTimeUTC, tx = prisma) {
    const activeMentors = await tx.mentor.findMany({
      where: { active: true },
    });

    const eligibleMentors = [];

    for (const mentor of activeMentors) {
      // 1. Check working hours
      const inWorkingHours = isWithinMentorWorkingHours(
        startTimeUTC,
        endTimeUTC,
        mentor.timezone,
        mentor.workStartHour,
        mentor.workEndHour
      );
      if (!inWorkingHours) continue;

      // 2. Check mentor's daily limit on their local day
      const { startUTC, endUTC } = getMentorLocalDayRange(startTimeUTC, mentor.timezone);

      const dailyBookingsCount = await tx.booking.count({
        where: {
          mentorId: mentor.id,
          status: 'CONFIRMED',
          startTimeUTC: {
            gte: startUTC,
            lte: endUTC,
          },
        },
      });

      if (dailyBookingsCount >= CONFIG.MAX_CLASSES_PER_MENTOR_PER_DAY) {
        continue; // Mentor already at capacity for their local calendar day
      }

      // 3. Check for overlapping bookings
      // Overlap condition: (existing.startTime < newEnd) AND (existing.endTime > newStart)
      const overlappingBooking = await tx.booking.findFirst({
        where: {
          mentorId: mentor.id,
          status: 'CONFIRMED',
          AND: [
            { startTimeUTC: { lt: endTimeUTC } },
            { endTimeUTC: { gt: startTimeUTC } },
          ],
        },
      });

      if (overlappingBooking) {
        continue; // Mentor is already occupied
      }

      eligibleMentors.push({
        mentor,
        todayCount: dailyBookingsCount,
      });
    }

    return eligibleMentors;
  }
}

export const mentorService = new MentorService();
export default mentorService;
