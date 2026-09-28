import React from 'react';
import { Globe, Sparkles, SlidersHorizontal, Clock, Zap, ShieldCheck } from 'lucide-react';
import { getTimezoneSummary } from '../utils/timezones';

export default function Navbar({ selectedTimezone, onOpenTimezoneModal, onOpenAdminDrawer }) {
  const tzSummary = getTimezoneSummary(selectedTimezone);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25 ring-4 ring-brand-50 transition-transform hover:scale-105">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                  codeyoung
                </span>
                <span className="bg-gradient-to-r from-brand-50 to-indigo-50 text-brand-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-brand-200/60 shadow-xs">
                  Trial Classes
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 hidden sm:flex">
                <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>10 Mentors Active</span>
                </span>
                <span>•</span>
                <span>Max 2 Classes/Day</span>
              </div>
            </div>
          </div>

          {/* Timezone Selector & Admin Trigger */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            {/* Interactive Timezone Pill */}
            <button
              onClick={onOpenTimezoneModal}
              className="group flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl border border-slate-200/80 hover:border-brand-400 bg-slate-50/80 hover:bg-white text-xs sm:text-sm text-slate-700 font-medium transition-all shadow-xs hover:shadow-md"
              title="Click to change your timezone"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center text-brand-600 transition">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="text-left leading-tight">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-800">{tzSummary.offsetAbbr}</span>
                  <span className="text-slate-400 text-xs hidden md:inline font-mono">({tzSummary.offsetFormatted})</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[110px] sm:max-w-[150px]">
                  {selectedTimezone.replace('_', ' ')}
                </div>
              </div>

              {tzSummary.isInDST && (
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md border border-amber-200 hidden lg:inline">
                  DST
                </span>
              )}
            </button>

            {/* Admin / Demo Hub Button */}
            <button
              onClick={onOpenAdminDrawer}
              className="relative group flex items-center space-x-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-slate-900/15 hover:shadow-lg transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 text-brand-400 group-hover:rotate-45 transition-transform duration-200" />
              <span className="hidden sm:inline">Admin Hub</span>
              <span className="sm:hidden">Admin</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
