import React, { useState, useMemo } from 'react';
import { X, Search, Check, MapPin, Clock } from 'lucide-react';
import { POPULAR_TIMEZONES, detectBrowserTimezone, getTimezoneSummary } from '../utils/timezones';

export default function TimezoneSelector({ isOpen, onClose, selectedTimezone, onSelectTimezone }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');

  const regions = ['All', 'Americas', 'Europe', 'Asia', 'Middle East', 'Oceania'];

  const filteredTimezones = useMemo(() => {
    return POPULAR_TIMEZONES.filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.zone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = activeRegion === 'All' || item.region === activeRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchTerm, activeRegion]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Select Your Timezone</h3>
            <p className="text-xs text-slate-500">All trial slots will be dynamically scheduled in your local time</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Auto-Detect */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by city, country or zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Region Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    activeRegion === region
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const auto = detectBrowserTimezone();
                onSelectTimezone(auto);
                onClose();
              }}
              className="flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0 ml-2"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Auto-Detect</span>
            </button>
          </div>
        </div>

        {/* Timezone List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
          {filteredTimezones.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No timezones found matching "{searchTerm}"
            </div>
          ) : (
            filteredTimezones.map((tz) => {
              const isSelected = tz.zone === selectedTimezone;
              const summary = getTimezoneSummary(tz.zone);

              return (
                <button
                  key={tz.zone}
                  onClick={() => {
                    onSelectTimezone(tz.zone);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-brand-50 border border-brand-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900">{tz.label}</span>
                      {summary.isInDST && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1 rounded">
                          DST
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span>{tz.zone}</span>
                      <span>•</span>
                      <span>{summary.offsetAbbr} ({summary.offsetFormatted})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right text-xs">
                      <div className="font-medium text-slate-700 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{summary.currentTimeFormatted}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-slate-600 hover:text-slate-900 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
