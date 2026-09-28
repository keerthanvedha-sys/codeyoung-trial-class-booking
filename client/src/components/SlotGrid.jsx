import React from 'react';
import { Clock, Sun, Sunset, Moon, AlertCircle, Sparkles, CheckCircle2, ChevronRight, Users } from 'lucide-react';

export default function SlotGrid({
  slots,
  isLoading,
  selectedSlot,
  onSelectSlot,
  timezone,
  onJumpToNextDay,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-slate-200 rounded-lg w-48"></div>
            <div className="h-6 bg-slate-100 rounded-full w-28"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Slots Configured</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          There are no operating hours configured for this selected date.
        </p>
      </div>
    );
  }

  // Filter slots into Morning, Afternoon, Evening
  const morningSlots = [];
  const afternoonSlots = [];
  const eveningSlots = [];

  slots.forEach((slot) => {
    const hour = parseInt(slot.localTime24.split(':')[0], 10);
    if (hour < 12) {
      morningSlots.push(slot);
    } else if (hour < 17) {
      afternoonSlots.push(slot);
    } else {
      eveningSlots.push(slot);
    }
  });

  const availableTotal = slots.filter((s) => s.available).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-8">
      {/* Header and Live Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              Select Start Time (30-Min Session)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Displayed in your local time zone: <strong className="text-slate-800 font-semibold">{timezone}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{availableTotal} slots open today</span>
          </span>
        </div>
      </div>

      {/* When All Slots for the Day are Booked */}
      {availableTotal === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-6 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-amber-900">
                All trial-class slots are currently booked for this day
              </h4>
              <p className="text-xs text-amber-800/90 mt-1 max-w-xl">
                Our 10 mentors have reached their daily limit (2 classes/day) or are occupied with scheduled students.
              </p>
            </div>
          </div>
          {onJumpToNextDay && (
            <button
              onClick={onJumpToNextDay}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-md shadow-amber-600/20 hover:shadow-lg"
            >
              <span>Check Tomorrow's Openings</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Morning Section */}
      {morningSlots.length > 0 && (
        <SlotSection
          title="Morning Slots"
          icon={<Sun className="w-4 h-4 text-amber-500" />}
          slots={morningSlots}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
        />
      )}

      {/* Afternoon Section */}
      {afternoonSlots.length > 0 && (
        <SlotSection
          title="Afternoon Slots"
          icon={<Sunset className="w-4 h-4 text-orange-500" />}
          slots={afternoonSlots}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
        />
      )}

      {/* Evening Section */}
      {eveningSlots.length > 0 && (
        <SlotSection
          title="Evening Slots"
          icon={<Moon className="w-4 h-4 text-indigo-500" />}
          slots={eveningSlots}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
        />
      )}
    </div>
  );
}

function SlotSection({ title, icon, slots, selectedSlot, onSelectSlot }) {
  const openCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {icon}
          <span>{title}</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          {openCount} of {slots.length} available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.startTimeUTCIso === slot.startTimeUTCIso;
          const isAvailable = slot.available;

          return (
            <button
              key={slot.startTimeUTCIso}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectSlot(slot)}
              className={`group relative p-3 sm:p-3.5 rounded-2xl border text-center transition-all duration-150 flex flex-col items-center justify-center ${
                !isAvailable
                  ? 'bg-slate-50/60 border-slate-200/50 text-slate-300 cursor-not-allowed opacity-50'
                  : isSelected
                  ? 'bg-gradient-to-b from-brand-600 to-indigo-700 border-brand-600 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-500 ring-offset-2 scale-[1.02]'
                  : 'bg-white hover:bg-brand-50/40 hover:border-brand-300 border-slate-200/90 text-slate-800 shadow-2xs hover:shadow-md'
              }`}
            >
              {/* Slot Time */}
              <span className={`font-bold text-sm sm:text-base tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {slot.localTime}
              </span>

              {/* Timezone Abbr */}
              <span className={`text-[10px] font-semibold tracking-wide ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                {slot.timeZoneAbbr}
              </span>

              {/* Availability Indicator */}
              {isAvailable ? (
                <div
                  className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></span>
                  <span>{slot.availableMentorsCount} free</span>
                </div>
              ) : (
                <span className="mt-2 text-[10px] font-medium text-slate-400">
                  {slot.reason === 'PAST_TIME' ? 'Past' : 'Booked'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
