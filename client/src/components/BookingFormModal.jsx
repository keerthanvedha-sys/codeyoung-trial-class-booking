import React, { useState } from 'react';
import { X, Calendar, Clock, Globe, Shield, User, Mail, Sparkles, AlertCircle, Loader2, Code2, Bot, Gamepad2, Award } from 'lucide-react';
import { getTimezoneSummary } from '../utils/timezones';

export default function BookingFormModal({
  isOpen,
  onClose,
  selectedSlot,
  selectedDate,
  timezone,
  onBookingSuccess,
  api,
}) {
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [learningTrack, setLearningTrack] = useState('Python & Game Dev');
  const [ageGroup, setAgeGroup] = useState('Ages 9-13');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  if (!isOpen || !selectedSlot) return null;

  const tzSummary = getTimezoneSummary(timezone);

  const tracks = [
    { name: 'Python & Game Dev', icon: <Code2 className="w-3.5 h-3.5" /> },
    { name: 'Scratch & Visual Coding', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { name: 'AI & Robotics Prep', icon: <Bot className="w-3.5 h-3.5" /> },
  ];

  const validate = () => {
    const errors = {};
    if (!parentName.trim() || parentName.trim().length < 2) {
      errors.parentName = 'Please enter your full name (minimum 2 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!parentEmail.trim() || !emailRegex.test(parentEmail.trim())) {
      errors.parentEmail = 'Please provide a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim(),
        parentTimezone: timezone,
        slotDate: selectedDate,
        slotTime: selectedSlot.localTime24,
        startTimeUTC: selectedSlot.startTimeUTCIso,
      };

      const response = await api.createBooking(payload);

      if (response.success && response.data) {
        onBookingSuccess(response.data);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to complete booking.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setErrorMessage(
        err.message || 'Something went wrong while reserving your slot. Please try another time.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 p-6 sm:p-7 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-brand-100 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>1:1 Live Interactive Trial Class</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">Confirm Your Session</h2>
          <p className="text-brand-100 text-xs mt-1">
            Free 30-minute hands-on trial session with an expert coding mentor
          </p>
        </div>

        {/* Selected Slot Time Badge */}
        <div className="bg-slate-50/80 border-b border-slate-100 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm">{selectedDate}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Your Time</span>
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                  {selectedSlot.localTime} ({selectedSlot.timeZoneAbbr})
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-start space-x-2.5">
            <Globe className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="text-slate-800 font-bold">{timezone}</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Your mentor in India (IST) will be automatically assigned and synchronized with your local time.
              </p>
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Slot Unavailable</p>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Child Learning Track & Age Selector (EdTech Feature) */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Interest
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tracks.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setLearningTrack(t.name)}
                  className={`p-2 rounded-xl border text-left transition-all text-xs font-semibold flex flex-col justify-between ${
                    learningTrack === t.name
                      ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="mb-1 text-brand-600">{t.icon}</span>
                  <span className="text-[11px] leading-tight">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Parent Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={parentName}
                onChange={(e) => {
                  setParentName(e.target.value);
                  if (fieldErrors.parentName) setFieldErrors({ ...fieldErrors, parentName: null });
                }}
                placeholder="e.g. David Miller"
                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                  fieldErrors.parentName ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white'
                }`}
              />
            </div>
            {fieldErrors.parentName && (
              <p className="text-red-600 text-[11px] mt-1 font-medium">{fieldErrors.parentName}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Parent Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => {
                  setParentEmail(e.target.value);
                  if (fieldErrors.parentEmail) setFieldErrors({ ...fieldErrors, parentEmail: null });
                }}
                placeholder="david.miller@example.com"
                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                  fieldErrors.parentEmail ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white'
                }`}
              />
            </div>
            {fieldErrors.parentEmail && (
              <p className="text-red-600 text-[11px] mt-1 font-medium">{fieldErrors.parentEmail}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Trial class join link and mentor calendar invite will be sent here.
            </p>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning Mentor & Booking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm Free Trial Class</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5 pt-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Free • No Payment Required • Certified Mentors</span>
          </div>
        </form>
      </div>
    </div>
  );
}
