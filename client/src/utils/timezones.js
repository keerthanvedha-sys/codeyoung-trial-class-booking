import { DateTime, IANAZone } from 'luxon';

export const POPULAR_TIMEZONES = [
  // US & Canada
  { label: 'Eastern Time (US & Canada)', zone: 'America/New_York', region: 'Americas' },
  { label: 'Central Time (US & Canada)', zone: 'America/Chicago', region: 'Americas' },
  { label: 'Mountain Time (US & Canada)', zone: 'America/Denver', region: 'Americas' },
  { label: 'Pacific Time (US & Canada)', zone: 'America/Los_Angeles', region: 'Americas' },
  { label: 'Alaska Time', zone: 'America/Anchorage', region: 'Americas' },
  { label: 'Hawaii Time', zone: 'Pacific/Honolulu', region: 'Americas' },
  { label: 'Toronto, Montreal', zone: 'America/Toronto', region: 'Americas' },
  { label: 'Vancouver', zone: 'America/Vancouver', region: 'Americas' },

  // UK & Europe
  { label: 'London, Edinburgh, Dublin (GMT/BST)', zone: 'Europe/London', region: 'Europe' },
  { label: 'Paris, Berlin, Rome, Madrid (CET/CEST)', zone: 'Europe/Paris', region: 'Europe' },
  { label: 'Amsterdam, Brussels', zone: 'Europe/Amsterdam', region: 'Europe' },
  { label: 'Athens, Helsinki, Bucharest', zone: 'Europe/Athens', region: 'Europe' },

  // Asia & Middle East
  { label: 'India Standard Time (IST)', zone: 'Asia/Kolkata', region: 'Asia' },
  { label: 'Dubai, Abu Dhabi (GST)', zone: 'Asia/Dubai', region: 'Middle East' },
  { label: 'Singapore, Malaysia (SGT)', zone: 'Asia/Singapore', region: 'Asia' },
  { label: 'Hong Kong (HKT)', zone: 'Asia/Hong_Kong', region: 'Asia' },
  { label: 'Tokyo, Japan (JST)', zone: 'Asia/Tokyo', region: 'Asia' },

  // Australia & New Zealand
  { label: 'Sydney, Melbourne (AEST/AEDT)', zone: 'Australia/Sydney', region: 'Oceania' },
  { label: 'Perth (AWST)', zone: 'Australia/Perth', region: 'Oceania' },
  { label: 'Auckland, Wellington (NZST/NZDT)', zone: 'Pacific/Auckland', region: 'Oceania' },
];

/**
 * Detects the user's browser IANA timezone safely with fallback.
 */
export function detectBrowserTimezone() {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && IANAZone.isValidZone(detected)) {
      return detected;
    }
  } catch (err) {
    console.warn('Error detecting browser timezone:', err);
  }
  return 'America/New_York'; // Sensible default
}

/**
 * Formats current time and DST status for a specified timezone.
 */
export function getTimezoneSummary(zone) {
  try {
    const now = DateTime.now().setZone(zone);
    return {
      currentTimeFormatted: now.toFormat('hh:mm a'),
      offsetAbbr: now.offsetNameShort,
      offsetFormatted: now.toFormat('ZZZZ'),
      isInDST: now.isInDST,
      displayString: `${now.toFormat('hh:mm a')} ${now.offsetNameShort} (${now.toFormat('ZZZZ')})`,
    };
  } catch (err) {
    return {
      currentTimeFormatted: '',
      offsetAbbr: '',
      offsetFormatted: '',
      isInDST: false,
      displayString: zone,
    };
  }
}
