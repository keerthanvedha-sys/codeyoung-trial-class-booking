import React, { useState } from 'react';
import { CheckCircle2, Calendar, Clock, Video, Copy, Check, ArrowRight, UserCheck, Sparkles, Globe, Star, ExternalLink, CalendarPlus } from 'lucide-react';

export default function ConfirmationCard({ bookingData, onBookAnother }) {
  const [copied, setCopied] = useState(false);

  if (!bookingData) return null;

  const { parent, mentor, times, meetingLink, durationMinutes } = bookingData;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Google Calendar direct URL
  const generateGoogleCalendarUrl = () => {
    try {
      const startTime = new Date(times.utc.startTimeUTC).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endTime = new Date(times.utc.endTimeUTC).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const title = encodeURIComponent(`Codeyoung Trial Class with ${mentor.name}`);
      const details = encodeURIComponent(
        `Your Codeyoung 1:1 Trial Class is scheduled!\n\nMentor: ${mentor.name}\nMeeting Link: ${meetingLink}\n\nPlease join 5 minutes early.`
      );
      const location = encodeURIComponent(meetingLink);
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    } catch (e) {
      return '#';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Celebration Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-7 sm:p-9 text-white text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner ring-4 ring-white/10">
          <CheckCircle2 className="w-9 h-9 text-white" />
        </div>
        
        <span className="text-emerald-100 text-xs font-extrabold uppercase tracking-wider bg-emerald-800/40 px-3.5 py-1 rounded-full border border-white/15 shadow-2xs">
          Booking Confirmed & Synchronized
        </span>
        
        <h2 className="text-2xl sm:text-3xl font-extrabold mt-2.5 tracking-tight">
          Trial Class Reserved!
        </h2>
        
        <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          We have matched {parent.name} with certified mentor {mentor.name}. An email invitation has been dispatched.
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Assigned Mentor Card */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-brand-500/20 ring-4 ring-white">
              {mentor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wide">Assigned Mentor</span>
                <span className="flex items-center text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                  4.9 / 5.0
                </span>
              </div>
              <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{mentor.name}</h4>
              <p className="text-xs text-slate-500">Certified Coding & STEM Faculty • Codeyoung</p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Duration</span>
            <div className="text-lg font-extrabold text-slate-900">{durationMinutes} Mins</div>
            <span className="text-xs font-bold text-emerald-600">1:1 Dedicated</span>
          </div>
        </div>

        {/* Dual Timezone Synchronizer Box */}
        <div className="border border-slate-200/90 rounded-2xl p-5 space-y-4 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-brand-600" />
              <span>Timezone Synchronization Bridge</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Auto-Synced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Parent Local Time Box */}
            <div className="p-4 bg-white border border-brand-200 rounded-xl space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-brand-700">Your Local Time</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                  {times.parent.timeZoneAbbr}
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 pt-0.5">
                {times.parent.startTime} - {times.parent.endTime}
              </div>
              <p className="text-xs text-slate-600 font-semibold">{times.parent.date}</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">{times.parent.timezone}</p>
            </div>

            {/* Mentor Local Time Box */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-600">Mentor's Local Time</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {times.mentor.timeZoneAbbr}
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 pt-0.5">
                {times.mentor.startTime} - {times.mentor.endTime}
              </div>
              <p className="text-xs text-slate-600 font-semibold">{times.mentor.date}</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">{times.mentor.timezone}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl text-center">
            {bookingData.mentorNote || 'Your mentor is located in a different timezone. Their calendar is automatically synchronized.'}
          </p>
        </div>

        {/* Live Class Link & Actions */}
        <div className="bg-slate-950 text-white rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-brand-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                1:1 Live Classroom URL
              </span>
            </div>
            <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Room Ready</span>
            </span>
          </div>

          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 border border-white/10 text-xs">
            <span className="font-mono text-slate-200 truncate mr-2">{meetingLink}</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold transition shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl text-center text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/30"
            >
              <Video className="w-4 h-4" />
              <span>Join Live Demo Class</span>
            </a>

            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold rounded-xl text-center text-sm transition flex items-center justify-center space-x-2"
            >
              <CalendarPlus className="w-4 h-4 text-brand-300" />
              <span>Add to Google Calendar</span>
            </a>
          </div>
        </div>

        {/* Reset / Book another */}
        <div className="text-center pt-2">
          <button
            onClick={onBookAnother}
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            ← Schedule another trial class session
          </button>
        </div>
      </div>
    </div>
  );
}
