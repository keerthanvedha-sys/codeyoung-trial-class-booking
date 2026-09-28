import { DateTime, IANAZone } from 'luxon';

/**
 * Validates if the given string is a valid IANA timezone identifier.
 * @param {string} timezone 
 * @returns {boolean}
 */
export function isValidTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') return false;
  return IANAZone.isValidZone(timezone);
}

/**
 * Resolves standard timezone abbreviations like EDT, EST, BST, GMT, IST.
 * Uses locale-aware Intl.DateTimeFormat with sensible fallbacks.
 * 
 * @param {Date} date 
 * @param {string} timezone 
 * @returns {string}
 */
export function getTimeZoneAbbr(date, timezone) {
  let locale = 'en-US';
  if (timezone.startsWith('Europe/London') || timezone.startsWith('Europe/')) locale = 'en-GB';
  if (timezone.startsWith('Asia/Kolkata') || timezone.includes('Calcutta')) locale = 'en-IN';
  if (timezone.startsWith('Australia/')) locale = 'en-AU';

  try {
    const part = new Intl.DateTimeFormat(locale, { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value;
    if (part) return part;
  } catch (e) {
    // fallback
  }

  const luxonDt = DateTime.fromJSDate(date).setZone(timezone);
  return luxonDt.offsetNameShort || timezone;
}

/**
 * Converts a date and time in a specific timezone to a UTC JS Date and ISO string.
 * Accurately accounts for Daylight Saving Time based on the exact date.
 * 
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} timeStr - 'HH:mm'
 * @param {string} timezone - IANA timezone identifier
 * @returns {{ utcDate: Date, utcIso: string, luxonUtc: DateTime, luxonLocal: DateTime }}
 */
export function parseLocalToUTC(dateStr, timeStr, timezone) {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone identifier: ${timezone}`);
  }

  // Parse explicitly in the target timezone
  const combined = `${dateStr}T${timeStr}:00`;
  const localDt = DateTime.fromISO(combined, { zone: timezone });

  if (!localDt.isValid) {
    throw new Error(`Invalid date/time format: ${combined} in ${timezone} (${localDt.invalidExplanation})`);
  }

  const utcDt = localDt.toUTC();
  return {
    utcDate: utcDt.toJSDate(),
    utcIso: utcDt.toISO(),
    luxonUtc: utcDt,
    luxonLocal: localDt,
  };
}

/**
 * Converts a UTC Date or ISO string to the specified timezone with comprehensive formatting.
 * 
 * @param {Date|string} utcDateOrIso 
 * @param {string} timezone - IANA timezone identifier
 * @returns {object} Formatted timezone details
 */
export function formatInTimezone(utcDateOrIso, timezone) {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone identifier: ${timezone}`);
  }

  const dt = typeof utcDateOrIso === 'string'
    ? DateTime.fromISO(utcDateOrIso, { zone: 'utc' }).setZone(timezone)
    : DateTime.fromJSDate(utcDateOrIso, { zone: 'utc' }).setZone(timezone);

  if (!dt.isValid) {
    throw new Error(`Invalid UTC date: ${utcDateOrIso}`);
  }

  const jsDate = dt.toJSDate();
  const timeZoneAbbr = getTimeZoneAbbr(jsDate, timezone);

  return {
    time: dt.toFormat('hh:mm a'), // e.g. "10:00 AM"
    time24: dt.toFormat('HH:mm'), // e.g. "10:00"
    dateFormatted: dt.toFormat('cccc, MMMM d, yyyy'), // e.g. "Tuesday, September 29, 2026"
    dateIso: dt.toFormat('yyyy-MM-dd'),
    timezone,
    timeZoneAbbr, // e.g. "EDT", "EST", "IST", "BST", "GMT"
    offsetFormatted: dt.toFormat('ZZZZ'), // e.g. "UTC-4", "UTC+5:30"
    offsetMinutes: dt.offset,
    isInDST: dt.isInDST, // boolean true/false
    displayFull: `${dt.toFormat('hh:mm a')} ${timeZoneAbbr} (${dt.toFormat('ccc, LLL d')})`,
  };
}

/**
 * CRITICAL BUSINESS LOGIC:
 * Calculates the exact UTC time boundary for a mentor's local calendar day
 * based on an appointment UTC timestamp.
 * 
 * "Same day" is strictly evaluated against the mentor's local timezone.
 * 
 * @param {Date|string} appointmentUtcDate - The UTC appointment timestamp
 * @param {string} mentorTimezone - Mentor's IANA timezone (e.g. 'Asia/Kolkata')
 * @returns {{ startUTC: Date, endUTC: Date, mentorLocalDate: string }}
 */
export function getMentorLocalDayRange(appointmentUtcDate, mentorTimezone) {
  if (!isValidTimezone(mentorTimezone)) {
    throw new Error(`Invalid mentor timezone: ${mentorTimezone}`);
  }

  const utcDt = typeof appointmentUtcDate === 'string'
    ? DateTime.fromISO(appointmentUtcDate, { zone: 'utc' })
    : DateTime.fromJSDate(appointmentUtcDate, { zone: 'utc' });

  // Convert to mentor's local timezone
  const mentorLocalDt = utcDt.setZone(mentorTimezone);
  const mentorLocalDate = mentorLocalDt.toFormat('yyyy-MM-dd');

  // Start and end of that exact local day in mentor's timezone
  const startOfDayMentor = mentorLocalDt.startOf('day');
  const endOfDayMentor = mentorLocalDt.endOf('day');

  return {
    startUTC: startOfDayMentor.toUTC().toJSDate(),
    endUTC: endOfDayMentor.toUTC().toJSDate(),
    mentorLocalDate,
    startUTCIso: startOfDayMentor.toUTC().toISO(),
    endUTCIso: endOfDayMentor.toUTC().toISO(),
  };
}

/**
 * Checks whether an appointment interval falls inside mentor's working hours.
 * 
 * @param {Date} startTimeUTC 
 * @param {Date} endTimeUTC 
 * @param {string} mentorTimezone 
 * @param {number} workStartHour 
 * @param {number} workEndHour 
 * @returns {boolean}
 */
export function isWithinMentorWorkingHours(startTimeUTC, endTimeUTC, mentorTimezone, workStartHour = 9, workEndHour = 21) {
  const startLocal = DateTime.fromJSDate(startTimeUTC, { zone: 'utc' }).setZone(mentorTimezone);
  const endLocal = DateTime.fromJSDate(endTimeUTC, { zone: 'utc' }).setZone(mentorTimezone);

  const startHourFraction = startLocal.hour + startLocal.minute / 60;
  const endHourFraction = endLocal.hour + endLocal.minute / 60;

  if (startHourFraction >= workStartHour && endHourFraction <= workEndHour) {
    return true;
  }

  return false;
}

/**
 * Generates slot intervals for a given date in parent's timezone.
 * 
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} parentTimezone - IANA timezone
 * @param {number} durationMinutes - default 30
 * @param {number} startHour - default 8
 * @param {number} endHour - default 22
 * @returns {Array<{ localTime: string, startTimeUTC: Date, endTimeUTC: Date, timeZoneAbbr: string }>}
 */
export function generateDaySlotsForParent(dateStr, parentTimezone, durationMinutes = 30, startHour = 8, endHour = 22) {
  if (!isValidTimezone(parentTimezone)) {
    throw new Error(`Invalid timezone: ${parentTimezone}`);
  }

  const slots = [];
  let currentDt = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: parentTimezone })
    .set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });

  const endDt = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: parentTimezone })
    .set({ hour: endHour, minute: 0, second: 0, millisecond: 0 });

  while (currentDt < endDt) {
    const nextDt = currentDt.plus({ minutes: durationMinutes });
    if (nextDt > endDt) break;

    const slotJsDate = currentDt.toJSDate();
    const timeZoneAbbr = getTimeZoneAbbr(slotJsDate, parentTimezone);

    slots.push({
      parentDate: dateStr,
      localTime: currentDt.toFormat('hh:mm a'),
      localTime24: currentDt.toFormat('HH:mm'),
      timeZoneAbbr,
      parentTimezone,
      startTimeUTC: currentDt.toUTC().toJSDate(),
      endTimeUTC: nextDt.toUTC().toJSDate(),
      startTimeUTCIso: currentDt.toUTC().toISO(),
      endTimeUTCIso: nextDt.toUTC().toISO(),
    });

    currentDt = nextDt;
  }

  return slots;
}
