import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { REAL_DATA } from '../data/realData';
import { Navigation, ShieldAlert, Radio, Eye } from 'lucide-react';

// Fix leaflet default icon asset loading issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom CSS DivIcon creators to provide modern, color-coded map pins
const createCustomIcon = (emoji, colorClass) => {
  return L.divIcon({
    html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-base shadow-md border border-white ${colorClass}">${emoji}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const createSensorIcon = (status) => {
  const color = 
    status === 'Critical' ? 'bg-red-500 shadow-red-300' :
    status === 'Warning' ? 'bg-orange-500 shadow-orange-300' :
    status === 'Rising' ? 'bg-amber-500 shadow-amber-300' : 'bg-emerald-500 shadow-emerald-300';
  
  const pulseClass = status === 'Critical' || status === 'Warning' ? 'animate-ping' : '';

  return L.divIcon({
    html: `
      <div class="relative w-6 h-6 flex items-center justify-center">
        <span class="absolute inline-flex h-full w-full rounded-full ${color} opacity-75 ${pulseClass}"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${color} border border-white"></span>
      </div>
    `,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Map click event interceptor
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Sub-component to manage quick feedback input state independently per peer popup
function PeerMarker({ phone, peer, onSendFeedback }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendFeedback(phone, text.trim());
    setText('');
  };

  return (
    <Marker
      position={peer.coords}
      icon={createCustomIcon(peer.sosActive ? '🚨' : '👤', peer.sosActive ? 'bg-red-100 border-red-500 text-red-700 animate-pulse' : 'bg-indigo-150 border-indigo-500 text-indigo-700')}
    >
      <Popup>
        <div className="space-y-2 p-1 w-[200px]">
          <div className="flex items-center justify-between border-b pb-1">
            <span className="font-bold text-slate-850 truncate max-w-[110px]">{peer.name}</span>
            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded uppercase shrink-0">{peer.role}</span>
          </div>
          <div className="text-[10px] text-slate-600 leading-tight">Active Node on Resilient Ghana Network.</div>
          <div className="text-[9px] text-slate-500 font-semibold">Phone: {phone}</div>
          
          <form onSubmit={handleSubmit} className="border-t pt-2 space-y-1.5 mt-1.5">
            <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Tap to Send Feedback</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Type feedback..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 px-2 py-1 border border-slate-200 rounded text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[9px] rounded uppercase tracking-wider cursor-pointer"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const { reports, drones, sensors, sosAlert, sosSender, user, userCoords, setUserCoords, peers, sendFeedback } = useApp();
  
  // Layer visibility filters
  const [showMining, setShowMining] = useState(true);
  const [showFloods, setShowFloods] = useState(true);
  const [showDrones, setShowDrones] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showPeers, setShowPeers] = useState(true);

  // Focus Map Center on user's current coordinates
  const mapCenter = userCoords; 

  const handleMapClick = (coords) => {
    setUserCoords(coords);
  };

  return (
    <div className="space-y-4 fade-in relative h-[calc(100vh-100px)] flex flex-col">
      {/* SOS Alert Banner */}
      {sosAlert && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-600 text-white font-black px-6 py-2 rounded-full shadow-lg border-2 border-white animate-bounce flex items-center gap-2 text-xs md:text-sm">
          <ShieldAlert className="animate-spin" size={18} />
          <span>CRITICAL GLOBAL SOS: RESPONSE FORCES DEPLOYING</span>
        </div>
      )}

      {/* Map Control Bar Overlay */}
      <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3.5 shadow-md max-w-[260px] text-xs space-y-3">
        <div className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
          <Eye size={14} className="text-indigo-600" />
          <span>Layer Overlay Toggles</span>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 font-semibold text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showMining} 
              onChange={() => setShowMining(!showMining)}
              className="rounded text-red-500 focus:ring-red-400"
            />
            <span>Galamsey Reports (🔨)</span>
          </label>
          <label className="flex items-center gap-2.5 font-semibold text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showFloods} 
              onChange={() => setShowFloods(!showFloods)}
              className="rounded text-blue-500 focus:ring-blue-400"
            />
            <span>Flood Zones (💧)</span>
          </label>
          <label className="flex items-center gap-2.5 font-semibold text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showPeers} 
              onChange={() => setShowPeers(!showPeers)}
              className="rounded text-indigo-500 focus:ring-indigo-400"
            />
            <span>Active Users Nearby (👥)</span>
          </label>
          <label className="flex items-center gap-2.5 font-semibold text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showDrones} 
              onChange={() => setShowDrones(!showDrones)}
              className="rounded text-indigo-500 focus:ring-indigo-400"
            />
            <span>Surveillance Drones (🛸)</span>
          </label>
          <label className="flex items-center gap-2.5 font-semibold text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showSensors} 
              onChange={() => setShowSensors(!showSensors)}
              className="rounded text-emerald-500 focus:ring-emerald-400"
            />
            <span>GPS IoT Sensors (📡)</span>
          </label>
        </div>
        <div className="border-t pt-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
          💡 <strong>Tip:</strong> Click anywhere on the map to change your location and test proximity warning alarms.
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 w-full rounded-xl overflow-hidden shadow-md border border-slate-200">
        <MapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapClickHandler onClick={handleMapClick} />

          {/* Current User Marker ("You") */}
          <Marker 
            position={userCoords} 
            icon={createCustomIcon('🟢', 'bg-emerald-100 border-emerald-500 text-emerald-700 font-bold border-2 glow-red')}
          >
            <Popup>
              <div className="space-y-1 p-1 max-w-[200px]">
                <div className="font-extrabold text-slate-800">You ({user.name})</div>
                <div className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase w-fit">{user.role}</div>
                <p className="text-[10px] text-slate-500 font-semibold">Your simulated coordinates broadcast vector.</p>
              </div>
            </Popup>
          </Marker>

          {/* 5km Proximity Alert Range Circle */}
          <Circle 
            center={userCoords} 
            radius={5000} 
            pathOptions={{ color: '#6366F1', fillColor: '#6366F1', fillOpacity: 0.05, weight: 1, dashArray: '5, 8' }}
          />

          {/* Active SOS Beacon Overlay */}
          {sosSender && (
            <>
              <Marker
                position={sosSender.coords}
                icon={createCustomIcon('🚨', 'bg-red-600 border-red-700 text-white animate-bounce border-2 w-10 h-10 glow-red')}
              >
                <Popup>
                  <div className="space-y-1 p-1 max-w-[200px]">
                    <div className="font-extrabold text-red-650 text-[11px] animate-pulse">⚠️ CRITICAL SOS ALERT</div>
                    <div className="font-bold text-slate-800">{sosSender.name}</div>
                    <div className="text-[9px] text-slate-500 font-bold">Contact: {sosSender.phone}</div>
                    <p className="text-[10px] text-red-800 font-semibold mt-1">Distress beacon active. Click Stand Down to reset.</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={sosSender.coords}
                radius={2000} 
                pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.25, weight: 2 }}
              />
            </>
          )}

          {/* Active Peer Users Layer */}
          {showPeers && Object.keys(peers).map(phone => (
            <PeerMarker
              key={phone}
              phone={phone}
              peer={peers[phone]}
              onSendFeedback={sendFeedback}
            />
          ))}

          {/* Mining Reports Layer */}
          {showMining && reports
            .filter(r => r.type === 'Mining')
            .map(r => (
              <Marker 
                key={r.id} 
                position={r.coords} 
                icon={createCustomIcon('⛏️', r.status === 'Resolved' ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-red-100 border-red-400 text-red-700')}
              >
                <Popup>
                  <div className="space-y-1 p-1 max-w-[200px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-slate-800">{r.locationName}</span>
                      <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded uppercase">{r.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">{r.detail}</p>
                    <div className="text-[9px] text-slate-400 font-semibold italic">Reported at: {new Date(r.timestamp).toLocaleDateString()}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Flood Reports & Markers Layer */}
          {showFloods && reports
            .filter(r => r.type === 'Flood')
            .map(r => (
              <React.Fragment key={r.id}>
                <Marker 
                  position={r.coords} 
                  icon={createCustomIcon('💧', 'bg-blue-100 border-blue-400 text-blue-700')}
                >
                  <Popup>
                    <div className="space-y-1 p-1 max-w-[200px]">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-bold text-slate-800">Flood Spot</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded uppercase">{r.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">{r.detail}</p>
                      <div className="text-[10px] text-indigo-600 font-bold">{r.locationName}</div>
                    </div>
                  </Popup>
                </Marker>
                {/* Visual Flood Zone Highlight Overlay */}
                <Circle 
                  center={r.coords} 
                  radius={2500} 
                  pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.22, weight: 1.5 }}
                />
              </React.Fragment>
            ))}

          {/* Drones Layer with moving markers and flight pathways */}
          {showDrones && drones.map(drone => (
            <React.Fragment key={drone.id}>
              {/* Drone marker */}
              <Marker 
                position={drone.coords} 
                icon={createCustomIcon('🛸', 'bg-indigo-100 border-indigo-400 text-indigo-700 animate-bounce')}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-indigo-800 flex items-center gap-1">
                      <Navigation size={12} className="rotate-45" />
                      {drone.name}
                    </div>
                    <div>Status: <span className="font-semibold text-emerald-600">{drone.status}</span></div>
                    <div>Telemetry Battery: <span className="font-bold">{drone.battery.toFixed(0)}%</span></div>
                    <div className="text-[10px] text-slate-400 font-mono">Location: {drone.coords[0].toFixed(4)}, {drone.coords[1].toFixed(4)}</div>
                  </div>
                </Popup>
              </Marker>

              {/* Flight pathway lines */}
              <Polyline 
                positions={drone.path} 
                pathOptions={{ color: '#6366F1', weight: 1.5, dashArray: '5, 8', opacity: 0.6 }} 
              />
            </React.Fragment>
          ))}

          {/* GPS IoT Sensors Layer */}
          {showSensors && sensors.map(sensor => (
            <Marker 
              key={sensor.id} 
              position={sensor.coords} 
              icon={createSensorIcon(sensor.status)}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Radio size={12} className="text-indigo-500" />
                    {sensor.name}
                  </div>
                  <div>Water Level Reading: <span className="font-bold text-slate-800">{sensor.value}</span></div>
                  <div>
                    Risk Index Status:{' '}
                    <span className={`font-bold ${
                      sensor.status === 'Critical' ? 'text-red-600' :
                      sensor.status === 'Warning' ? 'text-orange-600' :
                      sensor.status === 'Rising' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {sensor.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {sensor.id}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Odaw River and Circle Static Flood Highlights */}
          {showFloods && (
            <>
              <Circle 
                center={REAL_DATA.locations.odawRiver} 
                radius={2000} 
                pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.15, weight: 2 }}
              >
                <Popup><strong>Odaw River Critical Basin</strong><br/>Severe Urban flood zone. Drainage desilting 75% complete.</Popup>
              </Circle>
              <Circle 
                center={REAL_DATA.locations.kwameNkrumahCircle} 
                radius={1200} 
                pathOptions={{ color: '#EF4444', fillColor: '#F59E0B', fillOpacity: 0.25, weight: 1.5 }}
              >
                <Popup><strong>Kwame Nkrumah Circle Interchange</strong><br/>High-density commerce flood hotspot.</Popup>
              </Circle>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
