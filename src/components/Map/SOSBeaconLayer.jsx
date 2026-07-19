import React from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, MapPin, Activity, Navigation, X } from 'lucide-react';

// Custom CSS for the pulsing animation and marker
const pulseIconHtml = `
  <div class="relative flex items-center justify-center w-8 h-8">
    <div class="absolute w-8 h-8 bg-red-500 rounded-full animate-ping opacity-75"></div>
    <div class="relative w-4 h-4 bg-red-600 border-2 border-white rounded-full shadow-lg"></div>
  </div>
`;

const pulseIcon = new L.DivIcon({
  html: pulseIconHtml,
  className: 'custom-pulse-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export default function SOSBeaconLayer({ activeAlerts = [], currentUser = {}, onRespond = null }) {
  const map = useMap();

  React.useEffect(() => {
    // If there's at least one active alert, center the map on the first one
    if (activeAlerts.length > 0) {
      const latestAlert = activeAlerts[0];
      if (latestAlert.coords) {
        map.flyTo(latestAlert.coords, 14, {
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [activeAlerts, map]);

  if (!activeAlerts || activeAlerts.length === 0) return null;

  return (
    <>
      {activeAlerts.map(alert => (
        <Marker key={alert.id} position={alert.coords} icon={pulseIcon}>
          <Popup className="sos-popup custom-popup" closeButton={false}>
            <div className="bg-slate-900 border-2 border-red-500/60 rounded-xl overflow-hidden shadow-2xl min-w-[240px]">
              {/* Header */}
              <div className="px-3 py-2 bg-red-900/70 border-b border-red-700/40 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
                <ShieldAlert size={14} className="text-red-300 shrink-0" />
                <span className="text-red-200 font-black text-xs uppercase tracking-widest truncate flex-1">
                  CRITICAL SOS
                </span>
              </div>
              
              {/* Body */}
              <div className="p-3">
                <div className="text-white font-bold text-sm mb-1">{alert.name} needs help!</div>
                <div className="text-slate-400 text-[10px] mb-2 font-mono flex items-center gap-1">
                  <MapPin size={10} className="text-red-400" />
                  {alert.coords[0].toFixed(5)}, {alert.coords[1].toFixed(5)}
                </div>
                
                <div className="flex items-center gap-1 text-red-400 text-[10px] font-black uppercase tracking-wider mb-3">
                  <Activity size={10} className="animate-spin" />
                  LIVE ALERT ACTIVE
                </div>

                {/* Actions */}
                {currentUser.phone !== alert.phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRespond) onRespond(alert);
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black text-xs uppercase tracking-wider transition-all shadow-lg flex justify-center items-center gap-2"
                  >
                    <Navigation size={14} /> Respond to SOS
                  </button>
                )}
                {currentUser.phone === alert.phone && (
                  <div className="text-center text-[10px] text-slate-400 italic">
                    This is your broadcasted SOS.
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
