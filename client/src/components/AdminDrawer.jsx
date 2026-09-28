import React, { useState, useEffect } from 'react';
import { X, Users, Mail, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, Clock, Trash2, ArrowUpRight, Sparkles, Check } from 'lucide-react';

export default function AdminDrawer({ isOpen, onClose, api, onDataReset }) {
  const [activeTab, setActiveTab] = useState('mentors'); // 'mentors' | 'notifications'
  const [mentors, setMentors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mentorRes, notifRes] = await Promise.all([
        api.getMentors(),
        api.getNotifications(25),
      ]);
      if (mentorRes.success) setMentors(mentorRes.data);
      if (notifRes.success) setNotifications(notifRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleResetData = async () => {
    if (!window.confirm('Reset all demo trial bookings and notifications to start fresh?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemo();
      setStatusMessage('Demo bookings cleared successfully. System reset to clean state.');
      await loadData();
      if (onDataReset) onDataReset();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      alert('Failed to reset demo data: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  const totalBookedToday = mentors.reduce((sum, m) => sum + m.todayBookingCount, 0);
  const maxCapacity = 20;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 text-slate-100 flex flex-col animate-in fade-in duration-200">
      <div className="w-full bg-slate-900 text-slate-100 h-full flex flex-col">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-lg text-white">Mentor Load & Evaluator Hub</h3>
                <span className="text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full">
                  Live Diagnostics
                </span>
              </div>
              <p className="text-xs text-slate-400">Assignment evaluator live inspection tool</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              title="Refresh Stats"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Capacity Gauge Banner */}
        <div className="bg-slate-800/60 p-5 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-extrabold text-slate-200">
              Platform Daily Quota (10 Mentors × 2 Classes/Day)
            </span>
            <span className="font-mono font-bold text-brand-400">
              {totalBookedToday} / {maxCapacity} Booked ({Math.round((totalBookedToday / maxCapacity) * 100)}%)
            </span>
          </div>

          <div className="w-full bg-slate-700/60 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-400 ${
                totalBookedToday >= maxCapacity
                  ? 'bg-red-500'
                  : totalBookedToday > 10
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-brand-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (totalBookedToday / maxCapacity) * 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>Evaluated strictly on mentor's local calendar day (Asia/Kolkata)</span>
            <span className="font-semibold text-emerald-400">
              {maxCapacity - totalBookedToday} Slots Open
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 px-6 pt-3 bg-slate-900/80 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('mentors')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'mentors'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>10 Mentors Live Status ({mentors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'notifications'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Simulated Email Logs ({notifications.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {statusMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {activeTab === 'mentors' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Mentors are load-balanced: the system assigns trial classes to mentors with the fewest bookings first. No mentor can conduct more than <strong>2 trial classes per local calendar day</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {mentors.map((mentor) => {
                  const isFull = mentor.todayBookingCount >= mentor.maxDailyCapacity;

                  return (
                    <div
                      key={mentor.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isFull
                          ? 'bg-red-950/20 border-red-800/60'
                          : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-sm text-white">{mentor.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{mentor.timezone}</div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isFull
                              ? 'bg-red-900/60 text-red-200 border border-red-700/60'
                              : mentor.todayBookingCount > 0
                              ? 'bg-amber-900/50 text-amber-200 border border-amber-700/50'
                              : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                          }`}
                        >
                          {mentor.todayBookingCount} / {mentor.maxDailyCapacity} Booked
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1 font-mono">
                          <Clock className="w-3 h-3 text-brand-400" />
                          <span>{mentor.localCurrentTime}</span>
                        </span>
                        <span className="font-semibold text-slate-300">
                          {mentor.availableCapacity} slots open
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Simulated confirmation emails formatted in the recipient's local time:
              </p>

              {notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  No notifications recorded yet. Book a trial session to inspect simulated emails.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {notifications.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-800/50 border border-slate-700/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            log.recipientType === 'PARENT'
                              ? 'bg-blue-900/50 text-blue-200 border border-blue-700/50'
                              : 'bg-purple-900/50 text-purple-200 border border-purple-700/50'
                          }`}
                        >
                          TO {log.recipientType}: {log.recipientEmail}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.sentAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-white">{log.subject}</div>
                      <div className="text-[11px] text-slate-400">
                        Formatted Time: <strong className="text-slate-200">{log.localTimeDisplay}</strong>
                      </div>

                      <pre className="text-[10px] bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {log.body}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer with Reset Action */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center space-x-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/60 px-3.5 py-2 rounded-xl transition border border-red-900/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Resetting Demo...' : 'Reset Demo Bookings'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-brand-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
