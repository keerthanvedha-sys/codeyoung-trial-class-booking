# Codeyoung Full Stack Engineer Assignment — AI Development Transcript

**Candidate:** Keerthan V V
**GitHub:** keerthanvedha-sys
**Repository:** `keerthanvedha-sys/codeyoung-trial-class-booking`
**AI Coding Assistant:** Antigravity (Google DeepMind)

---

## Session Overview

This document contains the developer prompts and AI agent responses from the development session for the Codeyoung Trial-Class Booking Platform.

The conversation covers the application's architecture, timezone and DST handling, mentor allocation, concurrency protection, database optimization, frontend UX, automated testing, and final repository verification.

---

# Turn 1 — Architecture, Data Contracts & UTC Storage

### Keerthan

I'm kicking off the Codeyoung trial-class booking platform. Let's align on the core domain constraints before writing any code:

* We have 10 trial class mentors available.
* Each mentor can take at most 2 classes per day, creating a hard ceiling of 20 classes/day across the platform.
* Parents are globally distributed, primarily US Eastern/Pacific and UK, while mentors are based in India (`Asia/Kolkata`).
* Tech stack: React (Vite) + Tailwind CSS for frontend; Node.js (Express) + SQLite with Prisma ORM for backend.

Before we scaffold, let's establish our core architectural contracts:

1. **Canonical Time Representation:** We must store appointment start and end times strictly in UTC (`startTimeUTC`, `endTimeUTC`). Local wall-clock strings must never be stored as the primary source of truth in the database.

2. **Timezone Library:** No manual offset math. We'll use Luxon with standard IANA timezone identifiers such as `America/New_York`, `Asia/Kolkata`, and `Europe/London` so Daylight Saving Time shifts are handled deterministically.

3. **Layered Separation:** I want thin Express controllers that only validate input and format HTTP responses. Business logic must live in dedicated services such as `timezoneService`, `mentorService`, `bookingService`, and `notificationService`.

4. **Scope Control:** No unnecessary paid dependencies or heavyweight authentication. For transactional emails, an in-memory/database `NotificationLog` is cleaner and allows evaluators to inspect dispatched emails directly.

Let's scaffold this structure and draft the Prisma schema. How should we model the database to enforce these rules at the schema level?

### Agent Response

Agreed on all points. Storing canonical UTC in ISO 8601 strings in SQLite prevents timezone drift and eliminates DST transition ambiguities.

The proposed Prisma schema contains:

* `Parent`: `id`, `name`, `email`, `timezone`, `createdAt`
* `Mentor`: `id`, `name`, `email`, `timezone`, `active`, `workStartHour`, `workEndHour`
* `Booking`: `id`, `parentId`, `mentorId`, `startTimeUTC`, `endTimeUTC`, `status`, `meetingLink`, `createdAt`
* `NotificationLog`: stores simulated email dispatches with localized time displays for both parent and mentor.

To guard against race conditions and double-booking at the database level, I recommend a composite unique constraint:

```prisma
@@unique([mentorId, startTimeUTC])
```

Even if concurrent requests bypass application-level checks, SQLite will reject an attempt to schedule the same mentor twice at the exact same start time.

### Keerthan

The `@@unique([mentorId, startTimeUTC])` constraint is a great database-level safety net. Go ahead and generate the Prisma schema, seed all 10 mentors in `Asia/Kolkata`, and set up the service skeletons.

---

# Turn 2 — Mentor Local-Day Edge Case

### Keerthan

Now let's tackle the trickiest domain rule in the assignment:

> "A mentor can conduct at most 2 demo classes per day. Same day should be considered based on the mentor's local timezone, not UTC calendar date."

Let's think through this edge case carefully.

Suppose a parent in New York (`America/New_York`, EDT UTC-4) books a trial class for Tuesday, October 27 at 10:00 PM.

* In UTC, this appointment is Wednesday, October 28 at 02:00 AM.
* In India (`Asia/Kolkata`, IST UTC+5:30), this appointment is Wednesday, October 28 at 07:30 AM.

If we naively extract the UTC date or evaluate against the parent's local calendar day, the booking could be credited to October 27. But for the Indian mentor, their working day is October 28.

How do we architect `timezoneService` so mentor quota calculation is immune to this midnight-crossing bug?

### Agent Response

We can build a dedicated function:

```text
getMentorLocalDayRange(appointmentUtcDate, mentorTimezone)
```

The algorithm is:

1. Accept the candidate appointment's UTC timestamp.
2. Convert it into the mentor's IANA timezone.
3. Compute the exact start and end of that mentor's local calendar day using Luxon's `startOf('day')` and `endOf('day')`.
4. Convert both local boundaries back into UTC.
5. Extract the mentor's local date string.

The booking count can then be calculated using the mentor's local-day UTC range:

```javascript
const { startUTC, endUTC, mentorLocalDate } =
  getMentorLocalDayRange(slotStartUTC, mentor.timezone);

const todayCount = await tx.booking.count({
  where: {
    mentorId: mentor.id,
    status: 'CONFIRMED',
    startTimeUTC: {
      gte: startUTC,
      lte: endUTC
    }
  }
});
```

This ensures the quota is evaluated according to the mentor's local calendar day rather than the parent's timezone or UTC date.

### Keerthan

That is rock solid. Let's make sure we write an explicit unit test for this midnight-crossing scenario: a booking at 11:30 PM EDT on Oct 27 must be verified to increment the mentor's quota on Oct 28 IST.

Implement `getMentorLocalDayRange` in `timezoneService.js` and integrate it into `mentorService.js`.

---

# Turn 3 — Mentor Allocation & Overlap Logic

### Keerthan

Now let's design the mentor assignment logic in `bookingService.js`.

When a parent selects a time slot, there might be multiple mentors who are free and have fewer than 2 bookings today.

Should we use simple round-robin or Least-Booked First? Why?

### Agent Response

**Least-Booked First** is better suited to this platform.

The reasons are:

1. **Preserving Availability:** If round-robin or first-available were used, one mentor could reach the daily limit while other mentors remained unused. Least-Booked First distributes bookings more evenly.
2. **Fair Workload Distribution:** Sessions are distributed across the 10 mentors.
3. **Deterministic Tie-Breaking:** If multiple mentors have the same booking count, `mentor.name ASC` can provide deterministic behavior.

For interval overlap checking, the condition should be:

```text
existing.startTimeUTC < newEndTimeUTC
AND
existing.endTimeUTC > newStartTimeUTC
```

If an existing booking ends at 10:30 AM and a new booking starts at 10:30 AM, the two bookings touch at the boundary but do not overlap.

### Keerthan

Agreed. Least-Booked First is much more defensible because it actively optimizes platform capacity.

Let's structure the allocation pipeline:

1. Filter active mentors whose working hours contain the candidate slot.
2. Filter out mentors with `≥2` bookings on their local calendar day.
3. Filter out mentors with overlapping bookings.
4. Sort eligible mentors by `todayCount ASC`, then `mentor.name ASC`.
5. Select the top mentor.

If no mentors remain eligible, throw a clean domain error: `SlotUnavailableError`.

Go ahead and implement this in `bookingService.js`.

---

# Turn 4 — Concurrency & Transactional Safety

### Keerthan

Let's talk about race conditions.

Suppose only one mentor remains available for the 3:00 PM slot. Two parents click "Confirm Booking" at the exact same millisecond.

If we only do application-level checks, both requests could read the mentor as available and attempt to insert a booking.

That's a classic Time-of-Check to Time-of-Use race condition.

How are we handling this in SQLite with Prisma?

### Agent Response

We handle this with a three-layer defense:

1. **Prisma Interactive Transaction:** Mentor eligibility evaluation and booking insertion are wrapped inside an atomic transaction.
2. **Database Unique Constraint:** `@@unique([mentorId, startTimeUTC])` acts as the final database-level protection.
3. **Error Normalization:** A Prisma `P2002` unique constraint violation is mapped to `SlotUnavailableError` and returned as HTTP `409 Conflict`.

Example response:

```json
{
  "success": false,
  "error": "That slot was just booked by another parent. Please choose another available time.",
  "code": "SlotUnavailableError"
}
```

This gives the parent a clear error instead of an unhandled server error.

### Keerthan

Let's also prevent duplicate bookings by the same parent.

If a parent double-clicks the submit button or has network retries, we shouldn't let them book two different mentors at the exact same time.

Inside the transaction, let's query whether a confirmed booking already exists for the parent's email during `[startTimeUTC, endTimeUTC]`. If so, reject it with a validation error.

### Agent Response

The transaction can check for an existing overlapping confirmed booking:

```javascript
const existingParentBooking = await tx.booking.findFirst({
  where: {
    parent: {
      email: parentData.email.toLowerCase().trim()
    },
    status: 'CONFIRMED',
    startTimeUTC: {
      lt: endUTC
    },
    endTimeUTC: {
      gt: startUTC
    }
  }
});

if (existingParentBooking) {
  throw new ValidationError(
    'You already have a confirmed trial class booked for this time slot.'
  );
}
```

This prevents the same parent from accidentally holding multiple mentors simultaneously.

---

# Turn 5 — DST Testing & Platform-Specific Issues

### Keerthan

Daylight Saving Time is one of the most critical grading requirements.

Let's write tests to verify:

* US Eastern switches from EDT (UTC-4) in summer to EST (UTC-5) in winter.
* UK switches from BST (UTC+1) in summer to GMT (UTC+0) in winter.
* India Standard Time remains IST (UTC+5:30) year-round without DST.

Run the test suite and let me know if everything passes cleanly.

### Agent Response

Running Vitest revealed two platform-specific issues:

1. **Timezone Abbreviation Formatting:** On Windows Node.js, Luxon's `offsetNameShort` returned `GMT-4` / `GMT-5` instead of `EDT` / `EST`.
2. **SQLite Test Concurrency:** Vitest ran test files in parallel, causing database lock contention because SQLite uses a single local database file.

### Keerthan

Here's how we fix those:

1. Use `Intl.DateTimeFormat` with appropriate locale mappings:

   * `en-US` for US
   * `en-GB` for UK
   * `en-IN` for India

2. In `vitest.config.js`, set:

```javascript
fileParallelism: false
```

and clean database state between tests.

Implement those fixes and rerun the tests.

### Agent Response

Implemented both fixes.

The test suite reported:

* `timezone.test.js`: 9 passed
* `booking.test.js`: 4 passed
* `mentorLimit.test.js`: 3 passed
* `concurrency.test.js`: 1 passed
* `api.test.js`: 7 passed

**All 24 automated tests passed.**

---

# Turn 6 — Database Optimization & N+1 Query Elimination

### Keerthan

Let's do a performance review of `slotService.js`.

In `getAvailableSlots(dateStr, timezone)`, we generate approximately 28 slots for a day.

Currently, for each slot, `findEligibleMentors()` loops through all 10 mentors and queries the database for daily count and overlap.

That means approximately:

```text
28 slots × 10 mentors × 2 queries = 560 database queries
```

How can we optimize `slotService` to batch this into a small number of database queries?

### Agent Response

We can eliminate the N+1 pattern by pre-fetching the day's schedule.

The approach is:

1. Compute the overall UTC window for the requested day.
2. Fetch all active mentors in one query.
3. Fetch all confirmed bookings within the relevant UTC window in one query.
4. Perform working-hours checks, daily-limit checks, and overlap checks in memory.

This reduces database round trips from approximately 560 queries to 2 queries.

### Keerthan

Exactly what I was looking for.

Update `slotService.js` with this bulk pre-fetching approach and rerun `tests/api.test.js` to ensure the slot availability endpoint still returns identical results.

### Agent Response

Implemented the bulk query optimization.

The API tests were rerun and all 7 tests passed.

---

# Turn 7 — UX Polish & Evaluator Diagnostics

### Keerthan

Now let's review the frontend experience.

Parents should never have to perform mental timezone calculations.

What UX components should we have?

I want:

1. Automatic browser timezone detection with a searchable timezone picker.
2. A dual-timezone confirmation showing the parent's local time and mentor's local time.
3. Google Calendar integration.
4. An evaluator Admin & Demo Hub showing mentors, capacity, simulated emails, and a reset button.

### Agent Response

Implemented the elevated UI components:

* `Navbar.jsx`: live timezone badge, DST indicator, Admin Hub button.
* `DatePicker.jsx`: horizontal date selection.
* `SlotGrid.jsx`: morning/afternoon/evening grouping and availability indicators.
* `BookingFormModal.jsx`: parent inputs and curriculum selection.
* `ConfirmationCard.jsx`: dual-timezone comparison, mentor information, dummy classroom link, and Google Calendar event generation.
* `AdminDrawer.jsx`: mentor capacity gauges, simulated email viewer, and reset button.

The client build completed successfully with zero build errors.

---

# Turn 8 — Final Audit & Repository Verification

### Keerthan

Let's perform a final audit before finalizing the repository.

1. Run the full test suite and confirm all 24 tests pass.
2. In `README.md`:

   * Verify the setup instructions use `cd codeyoung-trial-class-booking`.
   * Refine the project description to use "production-oriented".
3. Verify git hygiene:

   * No `.env` files.
   * No `.db` files.
   * No `node_modules` files.
4. Check that the remote GitHub repository is public and accessible.

### Agent Response

Final verification reported:

1. Full test suite: **24 out of 24 tests passed** across all 5 test files.
2. `README.md` was updated with the correct clone directory and "production-oriented" wording.
3. Git tree audit confirmed:

   * 0 `.env` files tracked
   * 0 `.db` files tracked
   * 0 `node_modules` files tracked
4. GitHub repository was verified as public and accessible at:

```text
https://github.com/keerthanvedha-sys/codeyoung-trial-class-booking
```

---

# Final Verification Matrix

| Evaluation Criterion        | Implementation                            |
| --------------------------- | ----------------------------------------- |
| 10 Active Mentors           | Seed script                               |
| Maximum 2 Classes/Day       | Mentor service + tests                    |
| Mentor Local-Day Boundary   | Timezone service + midnight-crossing test |
| UTC Storage                 | Prisma booking model                      |
| DST Handling                | Luxon + Intl API                          |
| Race Condition Safety       | Prisma transaction + unique constraint    |
| Query Optimization          | Bulk schedule queries                     |
| Duplicate Parent Protection | Transaction-level validation              |
| Dual Timezone Presentation  | Confirmation card                         |
| Evaluator Inspection        | Admin & Demo Hub                          |
