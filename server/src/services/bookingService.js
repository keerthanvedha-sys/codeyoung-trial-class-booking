import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { parseLocalToUTC, formatInTimezone, isValidTimezone } from './timezoneService.js';
import mentorService from './mentorService.js';
import notificationService from './notificationService.js';
import { CONFIG } from '../config/constants.js';

export class SlotUnavailableError extends Error {
  constructor(message = 'That slot was just booked by another parent or is no longer available. Please choose another available time.') {
    super(message);
    this.name = 'SlotUnavailableError';
    this.statusCode = 409;
  }
}

export class PastDateError extends Error {
  constructor(message = 'Cannot book an appointment in the past.') {
    super(message);
    this.name = 'PastDateError';
    this.statusCode = 400;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class BookingService {
  /**
   * Generates a safe, professional dummy meeting link.
   */
  generateMeetingLink() {
    const meetingId = crypto.randomBytes(4).toString('hex');
    return `https://meet.codeyoung.com/trial-${meetingId}`;
  }

  /**
   * Books a trial class with transactional mentor allocation, double-booking prevention,
   * and duplicate parent booking protection.
   */
  async createBooking({ parentName, parentEmail, parentTimezone, slotDate, slotTime, startTimeUTCInput }) {
    // 1. Validate timezone
    if (!isValidTimezone(parentTimezone)) {
      throw new ValidationError(`Invalid IANA timezone identifier: "${parentTimezone}". Example: "America/New_York", "Europe/London".`);
    }

    // 2. Determine UTC appointment start and end times
    let startTimeUTC, endTimeUTC;

    if (slotDate && slotTime) {
      const parsed = parseLocalToUTC(slotDate, slotTime, parentTimezone);
      startTimeUTC = parsed.utcDate;
      endTimeUTC = new Date(startTimeUTC.getTime() + CONFIG.TRIAL_DURATION_MINUTES * 60 * 1000);
    } else if (startTimeUTCInput) {
      startTimeUTC = new Date(startTimeUTCInput);
      endTimeUTC = new Date(startTimeUTC.getTime() + CONFIG.TRIAL_DURATION_MINUTES * 60 * 1000);
    } else {
      throw new ValidationError('Must provide either (slotDate and slotTime) or startTimeUTCInput');
    }

    // 3. Strict past slot validation
    const now = new Date();
    if (startTimeUTC < now) {
      throw new PastDateError('Cannot book an appointment slot that has already passed.');
    }

    // 4. Atomic transaction to allocate mentor and prevent race conditions / double bookings
    let createdBooking;
    let selectedMentor;
    let parentRecord;

    const normalizedEmail = parentEmail.toLowerCase().trim();

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Prevent duplicate parent bookings at the same time slot
        const existingParentBooking = await tx.booking.findFirst({
          where: {
            parent: { email: normalizedEmail },
            status: 'CONFIRMED',
            AND: [
              { startTimeUTC: { lt: endTimeUTC } },
              { endTimeUTC: { gt: startTimeUTC } },
            ],
          },
        });

        if (existingParentBooking) {
          throw new ValidationError('You already have a trial class scheduled during this time slot.');
        }

        // Find all currently eligible mentors within this transaction
        const eligibleMentors = await mentorService.findEligibleMentors(
          startTimeUTC,
          endTimeUTC,
          tx
        );

        if (eligibleMentors.length === 0) {
          throw new SlotUnavailableError(
            'That slot was just booked by another parent or no mentor is available at this time. Please choose another available time.'
          );
        }

        // STRATEGY: Least-Booked First (Load Balancing)
        // Sort mentors by their booking count for today ascending, then tie-break by name
        eligibleMentors.sort((a, b) => {
          if (a.todayCount !== b.todayCount) {
            return a.todayCount - b.todayCount;
          }
          return a.mentor.name.localeCompare(b.mentor.name);
        });

        const chosen = eligibleMentors[0].mentor;

        // Upsert parent record
        let parent = await tx.parent.findFirst({
          where: { email: normalizedEmail },
        });

        if (parent) {
          parent = await tx.parent.update({
            where: { id: parent.id },
            data: {
              name: parentName.trim(),
              timezone: parentTimezone,
            },
          });
        } else {
          parent = await tx.parent.create({
            data: {
              name: parentName.trim(),
              email: normalizedEmail,
              timezone: parentTimezone,
            },
          });
        }

        // Generate unique meeting link
        const meetingLink = this.generateMeetingLink();

        // Create the booking record
        // @@unique([mentorId, startTimeUTC]) constraint will protect against concurrent collisions
        const booking = await tx.booking.create({
          data: {
            parentId: parent.id,
            mentorId: chosen.id,
            startTimeUTC,
            endTimeUTC,
            meetingLink,
            status: 'CONFIRMED',
          },
        });

        return {
          booking,
          mentor: chosen,
          parent,
        };
      });

      createdBooking = result.booking;
      selectedMentor = result.mentor;
      parentRecord = result.parent;
    } catch (err) {
      // Prisma unique constraint violation code is P2002
      if (err.code === 'P2002') {
        throw new SlotUnavailableError(
          'That slot was just booked by another parent. Please choose another available time.'
        );
      }
      throw err;
    }

    // 5. Fire simulated notifications asynchronously
    await notificationService.sendBookingConfirmation({
      booking: createdBooking,
      parent: parentRecord,
      mentor: selectedMentor,
    });

    // 6. Format dual-timezone localized confirmation
    const parentTimeFormatted = formatInTimezone(createdBooking.startTimeUTC, parentRecord.timezone);
    const parentEndTimeFormatted = formatInTimezone(createdBooking.endTimeUTC, parentRecord.timezone);
    const mentorTimeFormatted = formatInTimezone(createdBooking.startTimeUTC, selectedMentor.timezone);
    const mentorEndTimeFormatted = formatInTimezone(createdBooking.endTimeUTC, selectedMentor.timezone);

    return {
      success: true,
      bookingId: createdBooking.id,
      meetingLink: createdBooking.meetingLink,
      durationMinutes: CONFIG.TRIAL_DURATION_MINUTES,
      status: createdBooking.status,
      createdAt: createdBooking.createdAt,
      parent: {
        id: parentRecord.id,
        name: parentRecord.name,
        email: parentRecord.email,
        timezone: parentRecord.timezone,
      },
      mentor: {
        id: selectedMentor.id,
        name: selectedMentor.name,
        email: selectedMentor.email,
        timezone: selectedMentor.timezone,
      },
      times: {
        utc: {
          startTimeUTC: createdBooking.startTimeUTC.toISOString(),
          endTimeUTC: createdBooking.endTimeUTC.toISOString(),
        },
        parent: {
          timezone: parentRecord.timezone,
          timeZoneAbbr: parentTimeFormatted.timeZoneAbbr,
          isInDST: parentTimeFormatted.isInDST,
          date: parentTimeFormatted.dateFormatted,
          startTime: parentTimeFormatted.time,
          endTime: parentEndTimeFormatted.time,
          display: `${parentTimeFormatted.dateFormatted}, ${parentTimeFormatted.time} (${parentTimeFormatted.timeZoneAbbr})`,
        },
        mentor: {
          timezone: selectedMentor.timezone,
          timeZoneAbbr: mentorTimeFormatted.timeZoneAbbr,
          isInDST: mentorTimeFormatted.isInDST,
          date: mentorTimeFormatted.dateFormatted,
          startTime: mentorTimeFormatted.time,
          endTime: mentorEndTimeFormatted.time,
          display: `${mentorTimeFormatted.dateFormatted}, ${mentorTimeFormatted.time} (${mentorTimeFormatted.timeZoneAbbr})`,
        },
      },
      mentorNote: 'Your mentor may be in a different timezone. Their calendar is automatically adjusted.',
    };
  }

  /**
   * Retrieves booking details by ID with dual timezone presentation.
   */
  async getBookingById(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        parent: true,
        mentor: true,
      },
    });

    if (!booking) {
      return null;
    }

    const parentTime = formatInTimezone(booking.startTimeUTC, booking.parent.timezone);
    const parentEndTime = formatInTimezone(booking.endTimeUTC, booking.parent.timezone);
    const mentorTime = formatInTimezone(booking.startTimeUTC, booking.mentor.timezone);
    const mentorEndTime = formatInTimezone(booking.endTimeUTC, booking.mentor.timezone);

    return {
      bookingId: booking.id,
      meetingLink: booking.meetingLink,
      status: booking.status,
      durationMinutes: CONFIG.TRIAL_DURATION_MINUTES,
      createdAt: booking.createdAt,
      parent: {
        id: booking.parent.id,
        name: booking.parent.name,
        email: booking.parent.email,
        timezone: booking.parent.timezone,
      },
      mentor: {
        id: booking.mentor.id,
        name: booking.mentor.name,
        email: booking.mentor.email,
        timezone: booking.mentor.timezone,
      },
      times: {
        utc: {
          startTimeUTC: booking.startTimeUTC.toISOString(),
          endTimeUTC: booking.endTimeUTC.toISOString(),
        },
        parent: {
          timezone: booking.parent.timezone,
          timeZoneAbbr: parentTime.timeZoneAbbr,
          isInDST: parentTime.isInDST,
          date: parentTime.dateFormatted,
          startTime: parentTime.time,
          endTime: parentEndTime.time,
          display: `${parentTime.dateFormatted}, ${parentTime.time} (${parentTime.timeZoneAbbr})`,
        },
        mentor: {
          timezone: booking.mentor.timezone,
          timeZoneAbbr: mentorTime.timeZoneAbbr,
          isInDST: mentorTime.isInDST,
          date: mentorTime.dateFormatted,
          startTime: mentorTime.time,
          endTime: mentorEndTime.time,
          display: `${mentorTime.dateFormatted}, ${mentorTime.time} (${mentorTime.timeZoneAbbr})`,
        },
      },
    };
  }

  /**
   * Helper for evaluation / testing demo to reset sample bookings
   */
  async clearAllBookings() {
    await prisma.notificationLog.deleteMany({});
    return prisma.booking.deleteMany({});
  }
}

export const bookingService = new BookingService();
export default bookingService;
