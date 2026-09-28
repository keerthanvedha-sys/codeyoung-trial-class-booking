import React, { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { DateTime } from 'luxon';

export default function DatePicker({ selectedDate, onSelectDate, timezone }) {
  // Generate next 10 days dynamically in parent's timezone
  const daysList = useMemo(() => {
    const list = [];
    const baseDt = DateTime.now().setZone(timezone);

    for (let i = 0; i < 10; i++) {
      const dayDt = baseDt.plus({ days: i });
      const iso = dayDt.toFormat('yyyy-MM-dd');
      let label = dayDt.toFormat('ccc'); // 'Mon', 'Tue'
      if (i === 0) label = 'Today';
      if (i === 1) label = 'Tomorrow';

      list.push({
        iso,
        dayOfWeek: label,
        dayNumber: dayDt.toFormat('d'),
        monthName: dayDt.toFormat('LLL'),
        fullDateFormatted: dayDt.toFormat('EEEE, MMMM d, yyyy'),
      });
    }
    return list;
  }, [timezone]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              Select Session Date
            </h2>
            <p className="text-xs text-slate-500">Pick a day to browse 1:1 available trial class time slots</p>
          </div>
        </div>

        {/* Custom date input for evaluating any specific future date / DST transitions */}
        <div className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <span className="font-semibold text-slate-600">Pick date:</span>
          <input
            id="custom-date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-2xs"
          />
        </div>
      </div>

      {/* Modern Horizontal Date Strip */}
      <div className="flex space-x-3 overflow-x-auto pt-4 pb-2 scrollbar-none">
        {daysList.map((item) => {
          const isSelected = item.iso === selectedDate;

          return (
            <button
              key={item.iso}
              onClick={() => onSelectDate(item.iso)}
              className={`group flex-shrink-0 w-22 sm:w-26 py-3.5 px-2 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-b from-brand-600 to-indigo-700 border-brand-600 text-white shadow-lg shadow-brand-500/25 scale-[1.03]'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:border-brand-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 inset-x-0 h-1 bg-brand-300/40"></div>
              )}

              <span
                className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase ${
                  isSelected ? 'text-brand-100' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                {item.dayOfWeek}
              </span>

              <span className={`text-2xl sm:text-3xl font-extrabold my-0.5 tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {item.dayNumber}
              </span>

              <span className={`text-[11px] font-semibold ${isSelected ? 'text-brand-100' : 'text-slate-500'}`}>
                {item.monthName}
              </span>

              {item.dayOfWeek === 'Today' && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
