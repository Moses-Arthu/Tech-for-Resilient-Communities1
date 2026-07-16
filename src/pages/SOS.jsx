import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, BellOff, HelpCircle, Activity } from 'lucide-react';
import { triggerSMSAlert } from '../services/api';

export default function SOS() {
  const { sosAlert, setSosAlert, user, setDrones } = useApp();

  const handleSOSTrigger = () => {
    if (!sosAlert) {
      setSosAlert(true);
      // Trigger API mock alert
      triggerSMSAlert('+233 24 999 1111', `DISTRESS SOS BROADCAST: Triggered by ${user.name || 'Citizen'} via Resilient Communities portal.`);
      
      // Deploy all drones to search centers
      setDrones(prevDrones =>
        prevDrones.map(drone => ({
          ...drone,
          status: 'DEPLOYING TO SOS HAZARD AREA',
          coords: drone.base
        }))
      );
    } else {
      setSosAlert(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-center fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">SOS Beacon Terminal</h2>
        <p className="text-slate-500 font-medium">Instantly broadcast distress alerts to taskforces and responders within 5km.</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 flex flex-col items-center">
        {/* Large button */}
        <button
          onClick={handleSOSTrigger}
          className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-xl transition-all duration-300 transform active:scale-95 ${
            sosAlert 
              ? 'bg-red-600 text-white animate-pulse shadow-red-300' 
              : 'bg-slate-950 text-red-500 shadow-slate-300 hover:bg-slate-900'
          }`}
        >
          {/* Inner ring overlay */}
          <span className={`absolute inset-0 rounded-full border-4 border-opacity-50 border-red-500 ${
            sosAlert ? 'animate-ping' : ''
          }`} />
          
          <ShieldAlert size={48} className={sosAlert ? 'animate-bounce' : ''} />
          <span className="text-2xl font-black tracking-widest mt-2">
            {sosAlert ? 'SOS ACTIVE' : 'SOS ALERT'}
          </span>
          <span className="text-[10px] font-bold opacity-80 mt-1 uppercase">Click to Broadcast</span>
        </button>

        {/* Info banners */}
        {sosAlert ? (
          <div className="p-4 bg-red-50 text-red-900 border border-red-100 rounded-lg text-xs leading-relaxed font-semibold space-y-2">
            <div className="font-extrabold uppercase flex items-center gap-1.5 justify-center">
              <Activity className="animate-spin" size={14} />
              Distress Broadcast Actively Dispatched
            </div>
            <p>
              Your registered phone GPS signature and audio logs have been compiled. Emergency Taskforces are redirecting UAV surveillance vectors to your last known marker.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 text-slate-500 border rounded-lg text-xs leading-relaxed font-semibold flex items-start gap-2 text-left">
            <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p>
              Pressing this button broadcasts a high-priority distress signal including your browser GPS coordinates to the national NAIMOS response network. Verify your surroundings before activation.
            </p>
          </div>
        )}

        {sosAlert && (
          <button
            onClick={() => setSosAlert(false)}
            className="px-4 py-2 border hover:bg-slate-50 text-xs font-bold rounded-lg text-slate-600 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <BellOff size={14} /> Reset SOS Alarm
          </button>
        )}
      </div>
    </div>
  );
}
