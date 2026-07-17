import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, BellOff, HelpCircle, Activity, MapPin,
  Send, MessageCircle, Clock, Wifi, WifiOff, User, CheckCircle2,
  AlertTriangle, Navigation2
} from 'lucide-react';
import { triggerSMSAlert } from '../services/api';

// Elapsed time formatter
function useElapsedTime(startISO) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!startISO) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000);
      if (diff < 60) setElapsed(`${diff}s ago`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s ago`);
      else setElapsed(`${Math.floor(diff / 3600)}h ago`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [startISO]);
  return elapsed;
}

// SOS Duration Timer
function SOSTimer({ startISO }) {
  const [duration, setDuration] = useState('00:00');
  useEffect(() => {
    if (!startISO) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000);
      const m = String(Math.floor(diff / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setDuration(`${m}:${s}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [startISO]);
  return <span className="font-mono text-red-400 font-black text-2xl tracking-widest">{duration}</span>;
}

// Single feedback card
function FeedbackCard({ fb }) {
  const elapsed = useElapsedTime(fb.timestamp);
  const roleColors = {
    Responder: 'bg-blue-900/60 border-blue-500/40 text-blue-300',
    Authority: 'bg-purple-900/60 border-purple-500/40 text-purple-300',
    Admin: 'bg-amber-900/60 border-amber-500/40 text-amber-300',
    Citizen: 'bg-slate-800/80 border-slate-600/40 text-slate-400'
  };
  const colorClass = roleColors[fb.senderRole] || roleColors.Citizen;

  return (
    <div className="flex gap-3 items-start animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
        <User size={14} className="text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-xs truncate">{fb.senderName}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wide ${colorClass}`}>
            {fb.senderRole}
          </span>
          <span className="text-slate-500 text-[9px] font-semibold ml-auto">{elapsed}</span>
        </div>
        <p className="text-slate-300 text-xs mt-0.5 leading-relaxed break-words">{fb.text}</p>
      </div>
    </div>
  );
}

export default function SOS() {
  const { sosAlert, sosSender, sosFeedbacks, broadcastSOS, submitSOSFeedback, user, userCoords, gpsReady, gpsAccuracy } = useApp();
  const navigate = useNavigate();

  const [feedbackText, setFeedbackText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [acquiring, setAcquiring] = useState(false);

  // Whether the current user is the SOS sender
  const isSelf = sosSender && sosSender.phone === user.phone;

  const handleSOSTrigger = () => {
    if (sosAlert) {
      // Cancel SOS
      broadcastSOS(false);
      setConfirming(false);
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    // Confirmed — broadcast
    setAcquiring(true);
    broadcastSOS(true);
    // acquiring state will clear after GPS resolves (give 8s max)
    setTimeout(() => setAcquiring(false), 8500);
    setConfirming(false);
  };

  const handleCancelConfirm = () => setConfirming(false);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    submitSOSFeedback(feedbackText);
    setFeedbackText('');
  };

  const handleViewMap = () => navigate('/map');

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in pb-10">
      {/* Header */}
      <header className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">SOS Beacon Terminal</h2>
        <p className="text-slate-500 font-medium mt-1">
          Instantly broadcast a distress alert with your GPS location to every active user on the platform.
        </p>
      </header>

      {/* GPS Status Bar */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold ${
        gpsReady
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        {gpsReady ? <Wifi size={14} className="shrink-0" /> : <WifiOff size={14} className="shrink-0 animate-pulse" />}
        {gpsReady ? (
          <span>
            GPS LIVE — {userCoords[0].toFixed(5)}°N, {userCoords[1].toFixed(5)}°E
            {gpsAccuracy && <span className="opacity-70 font-semibold ml-2">(±{Math.round(gpsAccuracy)}m accuracy)</span>}
          </span>
        ) : (
          <span>Acquiring GPS signal… Please allow location access in your browser.</span>
        )}
        <MapPin size={12} className="ml-auto shrink-0" />
      </div>

      {/* Main SOS Card */}
      <div className={`rounded-2xl border-2 shadow-xl transition-all duration-500 overflow-hidden ${
        sosAlert
          ? 'border-red-500 bg-gradient-to-b from-red-950 to-slate-950 shadow-red-900/50'
          : 'border-slate-200 bg-white'
      }`}>
        <div className="p-8 flex flex-col items-center gap-6">

          {/* Confirmation overlay */}
          {confirming && !sosAlert && (
            <div className="w-full p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-center space-y-3 animate-pulse-once">
              <AlertTriangle className="mx-auto text-amber-500" size={28} />
              <p className="font-black text-amber-800 text-sm">Are you sure? This will alert ALL users on the platform.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleSOSTrigger}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-lg uppercase tracking-wider transition-all"
                >
                  YES — SEND SOS
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs rounded-lg uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Big SOS Button */}
          <button
            onClick={handleSOSTrigger}
            disabled={acquiring}
            className={`relative w-52 h-52 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-2xl transition-all duration-300 transform active:scale-95 select-none ${
              sosAlert
                ? 'bg-red-600 text-white shadow-red-400/60 animate-pulse'
                : confirming
                  ? 'bg-amber-500 text-white shadow-amber-400/60'
                  : 'bg-slate-950 text-red-500 shadow-slate-400/30 hover:bg-slate-800 hover:scale-105'
            } ${acquiring ? 'opacity-80 cursor-wait' : 'cursor-pointer'}`}
          >
            {/* Outer ping ring */}
            <span className={`absolute inset-0 rounded-full border-4 border-red-500/60 ${sosAlert ? 'animate-ping' : ''}`} />
            {/* Second ring */}
            {sosAlert && <span className="absolute inset-[-12px] rounded-full border-2 border-red-500/30 animate-ping" style={{ animationDelay: '0.3s' }} />}

            {acquiring ? (
              <>
                <Navigation2 size={44} className="animate-spin text-white" />
                <span className="text-sm font-black tracking-widest mt-2 text-white">LOCATING…</span>
                <span className="text-[10px] font-bold opacity-80 mt-1 text-white">Getting GPS Fix</span>
              </>
            ) : (
              <>
                <ShieldAlert size={52} className={sosAlert ? 'animate-bounce text-white' : confirming ? 'text-white' : ''} />
                <span className={`text-xl font-black tracking-widest mt-2 ${sosAlert ? 'text-white' : confirming ? 'text-white' : ''}`}>
                  {sosAlert ? 'SOS ACTIVE' : confirming ? 'CONFIRM?' : 'SOS ALERT'}
                </span>
                <span className={`text-[10px] font-bold opacity-80 mt-1 uppercase ${sosAlert || confirming ? 'text-white' : ''}`}>
                  {sosAlert ? 'Tap to Cancel' : 'Tap to Broadcast'}
                </span>
              </>
            )}
          </button>

          {/* Active SOS Status */}
          {sosAlert && sosSender && (
            <div className="w-full space-y-4">
              {/* Timer + active banner */}
              <div className="flex flex-col items-center gap-1 p-4 bg-red-900/40 rounded-xl border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400 text-[11px] font-black uppercase tracking-widest">
                  <Activity className="animate-spin" size={12} />
                  DISTRESS BROADCAST ACTIVE
                </div>
                <SOSTimer startISO={sosSender.timestamp} />
                <div className="text-[10px] text-red-300 font-semibold opacity-80">
                  {isSelf ? 'Your SOS is live — responders can see your location' : `Sent by ${sosSender.name}`}
                </div>
              </div>

              {/* Location pin info */}
              <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <MapPin size={18} className="text-red-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <div className="text-white font-bold text-xs">SOS Location Pinned on Map</div>
                  <div className="text-slate-400 text-[10px] font-mono mt-0.5">
                    {sosSender.coords[0].toFixed(6)}°N, {sosSender.coords[1].toFixed(6)}°E
                  </div>
                  <button
                    onClick={handleViewMap}
                    className="mt-2 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Navigation2 size={10} /> View on Live Map →
                  </button>
                </div>
              </div>

              {/* Cancel button (if self) */}
              {isSelf && (
                <button
                  onClick={() => broadcastSOS(false)}
                  className="w-full px-4 py-3 border-2 border-slate-600 hover:bg-slate-800/50 text-xs font-black rounded-xl text-slate-300 flex items-center justify-center gap-2 transition-all"
                >
                  <BellOff size={14} />
                  Stand Down — Cancel SOS Broadcast
                </button>
              )}
            </div>
          )}

          {/* Inactive info */}
          {!sosAlert && !confirming && (
            <div className="p-4 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-xs leading-relaxed font-semibold flex items-start gap-2.5 text-left w-full">
              <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p>
                Pressing this button broadcasts a high-priority distress signal including your precise GPS coordinates to
                <strong className="text-slate-700"> every active user</strong> on the platform. You will appear as a red
                beacon on the Live Map. Verify your surroundings before activation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Feedback Wall (visible to everyone when SOS is active) ─── */}
      {sosAlert && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
            <MessageCircle size={16} className="text-indigo-400" />
            <span className="font-black text-white text-sm uppercase tracking-wider">Community Response Wall</span>
            <span className="ml-auto bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              LIVE
            </span>
          </div>

          {/* Send feedback form */}
          {!isSelf && (
            <form onSubmit={handleFeedbackSubmit} className="px-5 py-4 border-b border-slate-700/60">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Respond — Your message is visible to all users on the platform
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="e.g. I'm 2km away, heading to help now…"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/60 transition-all"
                />
                <button
                  type="submit"
                  disabled={!feedbackText.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Send size={12} />
                  Send
                </button>
              </div>
            </form>
          )}

          {isSelf && (
            <div className="px-5 py-3 bg-red-950/40 border-b border-red-900/30">
              <p className="text-[11px] text-red-300 font-semibold flex items-center gap-2">
                <CheckCircle2 size={12} className="text-red-400" />
                You are the SOS sender. Responses from responders will appear below in real-time.
              </p>
            </div>
          )}

          {/* Feedback List */}
          <div className="px-5 py-4 space-y-4 max-h-72 overflow-y-auto">
            {sosFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <Clock size={24} className="mx-auto opacity-40" />
                <p className="text-xs font-semibold">Waiting for responses from the community…</p>
                <p className="text-[10px] opacity-60">All platform users have been notified.</p>
              </div>
            ) : (
              sosFeedbacks.map(fb => <FeedbackCard key={fb.id} fb={fb} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
