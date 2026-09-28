import prisma from '../db/prisma.js';
import { formatInTimezone } from './timezoneService.js';

/**
 * Base Notification Service interface / abstract class
 */
export class NotificationService {
  /**
   * @param {object} params
   * @param {object} params.booking
   * @param {object} params.parent
   * @param {object} params.mentor
   */
  async sendBookingConfirmation(params) {
    throw new Error('sendBookingConfirmation must be implemented by subclass');
  }
}

/**
 * Dummy Notification Service for Development and Assignment Evaluation.
 * Simulates sending transactional confirmation emails to both Parent and Mentor,
 * formatting times in their respective local timezones, generating logs, and persisting
 * to the NotificationLog table for interview demonstration.
 */
export class DummyNotificationService extends NotificationService {
  /**
   * Dispatches simulated notifications to parent and mentor.
   */
  async sendBookingConfirmation({ booking, parent, mentor }) {
    // 1. Format time for Parent in parent's local timezone
    const parentTimeInfo = formatInTimezone(booking.startTimeUTC, parent.timezone);
    const parentEndTimeInfo = formatInTimezone(booking.endTimeUTC, parent.timezone);

    // 2. Format time for Mentor in mentor's local timezone
    const mentorTimeInfo = formatInTimezone(booking.startTimeUTC, mentor.timezone);
    const mentorEndTimeInfo = formatInTimezone(booking.endTimeUTC, mentor.timezone);

    // 3. Craft Parent Notification
    const parentSubject = `Confirmed: Codeyoung Trial Class on ${parentTimeInfo.dateFormatted}`;
    const parentBody = `
Dear ${parent.name},

Your Codeyoung trial class has been successfully booked!

Class Details:
- Date: ${parentTimeInfo.dateFormatted}
- Time: ${parentTimeInfo.time} - ${parentEndTimeInfo.time} (${parentTimeInfo.timeZoneAbbr}, ${parent.timezone})
- Duration: 30 minutes
- Assigned Mentor: ${mentor.name}
- Live Class Link: ${booking.meetingLink}

Note: Your mentor is located in ${mentor.timezone}. Their calendar has been synchronized automatically.
Please join 5 minutes early to test your audio and video.

Happy Learning!
The Codeyoung Team
`.trim();

    // 4. Craft Mentor Notification
    const mentorSubject = `New Demo Class Scheduled: ${mentorTimeInfo.dateFormatted} at ${mentorTimeInfo.time} ${mentorTimeInfo.timeZoneAbbr}`;
    const mentorBody = `
Dear ${mentor.name},

A new trial class has been scheduled with you.

Session Details:
- Student/Parent: ${parent.name} (${parent.email})
- Student Timezone: ${parent.timezone}
- Your Local Time: ${mentorTimeInfo.dateFormatted} from ${mentorTimeInfo.time} to ${mentorEndTimeInfo.time} (${mentorTimeInfo.timeZoneAbbr}, ${mentor.timezone})
- Class Link: ${booking.meetingLink}

Please review the curriculum checklist prior to the session.

Codeyoung Mentor Operations
`.trim();

    // 5. Console simulation display
    console.log('\n=================== [SIMULATED EMAIL NOTIFICATIONS] ===================');
    console.log(`[TO PARENT: ${parent.email}]`);
    console.log(`Subject: ${parentSubject}`);
    console.log(`Local Time: ${parentTimeInfo.time} ${parentTimeInfo.timeZoneAbbr} (${parent.timezone})`);
    console.log(`Meeting Link: ${booking.meetingLink}`);
    console.log('------------------------------------------------------------------------');
    console.log(`[TO MENTOR: ${mentor.email}]`);
    console.log(`Subject: ${mentorSubject}`);
    console.log(`Local Time: ${mentorTimeInfo.time} ${mentorTimeInfo.timeZoneAbbr} (${mentor.timezone})`);
    console.log(`Meeting Link: ${booking.meetingLink}`);
    console.log('========================================================================\n');

    // 6. Persist to database for demo / evaluation inspection
    try {
      const logs = await prisma.$transaction([
        prisma.notificationLog.create({
          data: {
            bookingId: booking.id,
            recipientType: 'PARENT',
            recipientEmail: parent.email,
            recipientTimezone: parent.timezone,
            subject: parentSubject,
            body: parentBody,
            localTimeDisplay: `${parentTimeInfo.dateFormatted} at ${parentTimeInfo.time} ${parentTimeInfo.timeZoneAbbr}`,
          },
        }),
        prisma.notificationLog.create({
          data: {
            bookingId: booking.id,
            recipientType: 'MENTOR',
            recipientEmail: mentor.email,
            recipientTimezone: mentor.timezone,
            subject: mentorSubject,
            body: mentorBody,
            localTimeDisplay: `${mentorTimeInfo.dateFormatted} at ${mentorTimeInfo.time} ${mentorTimeInfo.timeZoneAbbr}`,
          },
        }),
      ]);

      return {
        success: true,
        logs,
      };
    } catch (err) {
      console.error('Failed to log notifications to database:', err.message);
      // Non-blocking for the booking flow
      return { success: true, logs: [] };
    }
  }

  /**
   * Retrieves recent notification logs for evaluation UI
   */
  async getRecentLogs(limit = 20) {
    return prisma.notificationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }
}

// Export default singleton instance
export const notificationService = new DummyNotificationService();
export default notificationService;
