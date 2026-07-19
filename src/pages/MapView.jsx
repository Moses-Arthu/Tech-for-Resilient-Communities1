import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { REAL_DATA } from '../data/realData';
import { Navigation, ShieldAlert, Radio, Eye, MapPin, MessageCircle, Send, Clock, User, Activity, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

// Fix leaflet default icon asset loading issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom CSS DivIcon creators
const createCustomIcon = (emoji, colorClass) => {
  return L.divIcon({
    html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-base shadow-md border border-white ${colorClass}">${emoji}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Galamsey incident icon — colour-coded by status
const createGalamseyIcon = (status) => {
  const bg = status === 'Active' ? '#dc2626' : status === 'Warning' ? '#f97316' : '#16a34a';
  return L.divIcon({
    html: `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        ${status === 'Active' ? `<span style="position:absolute;width:36px;height:36px;border-radius:50%;background:${bg};opacity:0.35;animation:ping 1.2s cubic-bezier(0,0,.2,1) infinite;"></span>` : ''}
        <div style="width:28px;height:28px;border-radius:50%;background:${bg};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:14px;z-index:1;">⛏️</div>
      </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Big SOS beacon icon with pulsing rings
const createSOSIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="width:64px;height:64px;">
        <span class="absolute inline-flex rounded-full bg-red-500 opacity-40 animate-ping" style="width:64px;height:64px;"></span>
        <span class="absolute inline-flex rounded-full bg-red-400 opacity-30 animate-ping" style="width:48px;height:48px;animation-delay:0.3s"></span>
        <div class="relative w-10 h-10 rounded-full bg-red-600 border-4 border-white shadow-2xl flex items-center justify-center text-white font-black text-base z-10">
          🚨
        </div>
      </div>
    `,
    className: '',
    iconSize: [64, 64],
    iconAnchor: [32, 32]
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

// Search result marker icon
const createSearchIcon = () => L.divIcon({
  html: `<div style="width:32px;height:40px;display:flex;flex-direction:column;align-items:center;">
    <div style="width:26px;height:26px;border-radius:50%;background:#4f46e5;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;">📍</div>
    <div style="width:3px;height:12px;background:#4f46e5;margin-top:-2px;border-radius:0 0 2px 2px;"></div>
  </div>`,
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

// Map click handler
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) { onClick([e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}

// Map automatic panner
function MapUpdater({ center, isSOS }) {
  const map = useMapEvents({});
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, isSOS ? 13 : map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center, isSOS, map]);
  return null;
}

// Fly-to on search result
function SearchFlyTo({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords) map.flyTo(coords, 14, { animate: true, duration: 1.5 });
  }, [coords, map]);
  return null;
}

// Peer marker with feedback form
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
      icon={createCustomIcon(
        peer.sosActive ? '🚨' : '👤',
        peer.sosActive
          ? 'bg-red-100 border-red-500 text-red-700 animate-pulse'
          : 'bg-indigo-150 border-indigo-500 text-indigo-700'
      )}
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

// SOS Info Panel — floating card showing sender info + feedback wall on the map
function SOSInfoPanel({ sosSender, sosFeedbacks, user, submitSOSFeedback }) {
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbacks, setShowFeedbacks] = useState(true);
  const isSelf = sosSender.phone === user.phone;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    submitSOSFeedback(feedbackText);
    setFeedbackText('');
  };

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[340px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden shadow-2xl border border-red-500/40"
      style={{ background: 'linear-gradient(160deg, #1a0a0a 0%, #0f172a 100%)' }}
    >
      {/* Top Banner */}
      <div className="px-4 py-3 bg-red-900/60 border-b border-red-700/40 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
        <span className="text-red-300 font-black text-xs uppercase tracking-widest">SOS Active — {sosSender.name}</span>
        <button
          onClick={() => setShowFeedbacks(v => !v)}
          className="ml-auto text-red-400 hover:text-red-200 text-[10px] font-bold transition-colors"
        >
          {showFeedbacks ? '▲ Hide' : '▼ Show'}
        </button>
      </div>

      {showFeedbacks && (
        <>
          {/* Sender location */}
          <div className="px-4 py-2.5 flex items-center gap-2.5 border-b border-slate-700/40">
            <MapPin size={13} className="text-red-400 shrink-0 animate-bounce" />
            <div className="min-w-0">
              <div className="text-white font-bold text-[10px] truncate">
                {isSelf ? 'Your SOS Location' : `${sosSender.name}'s Location`}
              </div>
              <div className="text-slate-400 font-mono text-[9px]">
                {sosSender.coords[0].toFixed(5)}°N, {sosSender.coords[1].toFixed(5)}°E
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1 text-red-400 text-[9px] font-black">
              <Activity size={10} className="animate-spin" />
              LIVE
            </div>
          </div>

          {/* Feedback wall */}
          <div className="px-4 py-2 border-b border-slate-700/40">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <MessageCircle size={10} />
              Community Responses ({sosFeedbacks.length})
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scroll">
              {sosFeedbacks.length === 0 ? (
                <div className="text-slate-500 text-[10px] flex items-center gap-1.5 py-1">
                  <Clock size={10} className="animate-pulse" />
                  Waiting for responses…
                </div>
              ) : (
                sosFeedbacks.slice(0, 8).map(fb => (
                  <div key={fb.id} className="flex gap-2 items-start">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                      <User size={9} className="text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-indigo-300 font-bold text-[9px]">{fb.senderName}</span>
                      <span className="text-slate-500 text-[8px] ml-1.5 font-semibold">{fb.senderRole}</span>
                      <p className="text-slate-300 text-[10px] leading-snug break-words mt-0.5">{fb.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick response form — only for non-senders */}
          {!isSelf && (
            <form onSubmit={handleSubmit} className="px-4 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Respond to help…"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white text-[10px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!feedbackText.trim()}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg transition-all flex items-center gap-1"
                >
                  <Send size={11} />
                </button>
              </div>
            </form>
          )}

          {isSelf && (
            <div className="px-4 py-2.5 text-[10px] text-red-300 font-semibold flex items-center gap-1.5">
              <ShieldAlert size={11} className="animate-pulse" />
              Your SOS is live. Responders see your location on the map.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Map Place Search Bar ───────────────────────────────────────────
function MapSearchBar({ onResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, format: 'json', limit: 5, countrycodes: 'gh' },
        headers: { 'Accept-Language': 'en' }
      });
      setResults(res.data);
    } catch {
      toast.error('Search failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') search(); };

  const pick = (r) => {
    onResult({ coords: [parseFloat(r.lat), parseFloat(r.lon)], name: r.display_name });
    setResults([]);
    setQuery('');
  };

  return (
    <div className="absolute top-2 left-12 z-[1000] w-72 max-w-[calc(100vw-100px)]">
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search a place in Ghana…"
            className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white/95 backdrop-blur text-xs font-semibold text-slate-800 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md text-xs font-bold flex items-center gap-1 disabled:opacity-60 transition-colors"
        >
          <Search size={13} />
          {loading ? '…' : 'Go'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-indigo-50 border-b border-slate-100 last:border-0 font-semibold leading-snug"
            >
              📍 {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapView() {
  const {
    reports, drones, sensors, sosAlert, sosSender, sosFeedbacks,
    user, userCoords, peers, sendFeedback, submitSOSFeedback
  } = useApp();

  const [showMining, setShowMining] = useState(true);
  const [showFloods, setShowFloods] = useState(true);
  const [showDrones, setShowDrones] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showPeers, setShowPeers] = useState(true);
  const [showGalamsey, setShowGalamsey] = useState(true);
  const [searchResult, setSearchResult] = useState(null);
  const [layersOpen, setLayersOpen] = useState(true);

  const mapCenter = userCoords;

  const handleMapClick = () => {
    toast.warning('🔒 Real-time GPS location tracking is active. Manual location overrides are disabled.');
  };

  return (
    <div className="space-y-4 fade-in relative h-[calc(100vh-100px)] flex flex-col">
      {/* SOS Alert Banner (top of map) */}
      {sosAlert && sosSender && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1001] bg-red-600 text-white font-black px-6 py-2 rounded-full shadow-2xl border-2 border-white animate-bounce flex items-center gap-2.5 text-xs md:text-sm whitespace-nowrap">
          <ShieldAlert className="animate-spin shrink-0" size={16} />
          <span>🚨 SOS ACTIVE — {sosSender.name.toUpperCase()} — RESPONSE FORCES DEPLOYING</span>
        </div>
      )}

      {/* ─── Map Place Search Bar ─── */}
      <MapSearchBar onResult={setSearchResult} />

      {/* Map Controls Panel — collapsible */}
      <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-md max-w-[220px] text-xs overflow-hidden">
        <button
          onClick={() => setLayersOpen(v => !v)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 font-extrabold text-slate-800 uppercase tracking-wider hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Eye size={14} className="text-indigo-600" />
            Layer Toggles
          </span>
          <span className="text-slate-400 text-[11px]">{layersOpen ? '▲' : '▼'}</span>
        </button>

        {layersOpen && (
          <div className="px-3.5 pb-3 space-y-2 border-t border-slate-100">
            <div className="space-y-2 pt-2">
              {[
                { label: 'Galamsey Incidents (⛏️)', state: showGalamsey, toggle: () => setShowGalamsey(v => !v), color: 'text-red-600' },
                { label: 'Reported Mining (🔨)', state: showMining, toggle: () => setShowMining(v => !v), color: 'text-red-500' },
                { label: 'Flood Zones (💧)', state: showFloods, toggle: () => setShowFloods(v => !v), color: 'text-blue-500' },
                { label: 'Active Users (👥)', state: showPeers, toggle: () => setShowPeers(v => !v), color: 'text-indigo-500' },
                { label: 'Drones (🛸)', state: showDrones, toggle: () => setShowDrones(v => !v), color: 'text-indigo-500' },
                { label: 'IoT Sensors (📡)', state: showSensors, toggle: () => setShowSensors(v => !v), color: 'text-emerald-500' },
              ].map(({ label, state, toggle, color }) => (
                <label key={label} className="flex items-center gap-2.5 font-semibold text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={state} onChange={toggle} className={`rounded focus:ring-1 ${color}`} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="border-t pt-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
              💡 <strong>Tip:</strong> Real-time GPS is active.
              {sosAlert && <span className="text-red-600 font-black ml-1"> 🚨 SOS BEACON ON MAP.</span>}
            </div>
          </div>
        )}
      </div>

      {/* Main Map */}
      <div className="flex-1 w-full rounded-xl overflow-hidden shadow-md border border-slate-200">
        <MapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapUpdater center={sosSender ? sosSender.coords : userCoords} isSOS={!!sosSender} />
          {searchResult && <SearchFlyTo coords={searchResult.coords} />}
          <MapClickHandler onClick={handleMapClick} />

          {/* Search result pin */}
          {searchResult && (
            <Marker position={searchResult.coords} icon={createSearchIcon()}>
              <Popup>
                <div className="text-xs font-semibold max-w-[220px]">
                  <div className="font-bold text-indigo-700 mb-1">📍 Search Result</div>
                  <p className="text-slate-600 leading-snug">{searchResult.name}</p>
                  <button onClick={() => setSearchResult(null)} className="mt-2 text-[10px] text-slate-400 hover:text-red-500 font-bold">✕ Remove pin</button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Current User Marker */}
          <Marker position={userCoords}>
            <Popup>
              <div className="space-y-1 p-1 max-w-[200px]">
                <div className="font-extrabold text-slate-800">You ({user.name})</div>
                <div className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase w-fit">{user.role}</div>
                <p className="text-[10px] text-slate-500 font-semibold font-mono">
                  {userCoords[0].toFixed(5)}°N, {userCoords[1].toFixed(5)}°E
                </p>
              </div>
            </Popup>
          </Marker>

          {/* 5km Proximity Alert Circle */}
          <Circle
            center={userCoords}
            radius={5000}
            pathOptions={{ color: '#6366F1', fillColor: '#6366F1', fillOpacity: 0.05, weight: 1, dashArray: '5, 8' }}
          />

          {/* ─── Hardcoded Real Galamsey Incidents ─── */}
          {showGalamsey && REAL_DATA.miningIncidents.map(incident => (
            <Marker key={incident.id} position={incident.coords} icon={createGalamseyIcon(incident.status)}>
              <Popup>
                <div className="space-y-1.5 p-1 max-w-[230px]">
                  <div className="flex items-center justify-between border-b pb-1.5 gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">⛏️ {incident.location}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      incident.status === 'Active' ? 'bg-red-100 text-red-700' :
                      incident.status === 'Warning' ? 'bg-orange-100 text-orange-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>{incident.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{incident.region} Region</div>
                  <p className="text-[11px] text-slate-600 leading-snug">{incident.detail}</p>
                  <div className="text-[9px] font-mono text-slate-400">{incident.coords[0].toFixed(4)}, {incident.coords[1].toFixed(4)}</div>
                </div>
              </Popup>
              {incident.status === 'Active' && (
                <Circle
                  center={incident.coords}
                  radius={1500}
                  pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.12, weight: 1.5, dashArray: '4,6' }}
                />
              )}
            </Marker>
          ))}

          {/* ─── SOS Beacon Overlay ─── */}
          {sosSender && (
            <>
              {/* Big pulsing SOS marker */}
              <Marker position={sosSender.coords} icon={createSOSIcon()}>
                <Popup>
                  <div className="space-y-1.5 p-1 max-w-[220px]">
                    <div className="font-extrabold text-red-600 text-[12px] flex items-center gap-1.5">
                      <ShieldAlert size={13} className="animate-pulse" /> ⚠️ CRITICAL SOS ALERT
                    </div>
                    <div className="font-bold text-slate-800 text-sm">{sosSender.name}</div>
                    <div className="text-[9px] text-slate-500 font-bold">📞 {sosSender.phone}</div>
                    <div className="text-[9px] font-mono text-slate-600">
                      📍 {sosSender.coords[0].toFixed(5)}°N, {sosSender.coords[1].toFixed(5)}°E
                    </div>
                    <p className="text-[10px] text-red-700 font-semibold mt-1 leading-snug">
                      Distress beacon active. All response units are being dispatched.
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Inner danger zone */}
              <Circle
                center={sosSender.coords}
                radius={500}
                pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.35, weight: 3 }}
              />
              {/* Outer alert zone */}
              <Circle
                center={sosSender.coords}
                radius={3000}
                pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.10, weight: 1.5, dashArray: '6,6' }}
              />
            </>
          )}

          {/* Active Peer Users */}
          {showPeers && Object.keys(peers).map(phone => (
            <PeerMarker
              key={phone}
              phone={phone}
              peer={peers[phone]}
              onSendFeedback={sendFeedback}
            />
          ))}

          {/* Reported Mining Reports */}
          {showMining && reports
            .filter(r => r.type === 'Mining')
            .map(r => (
              <Marker
                key={r.id}
                position={r.coords}
                icon={createCustomIcon('🔨', r.status === 'Resolved' ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-red-100 border-red-400 text-red-700')}
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

          {/* Flood Reports */}
          {showFloods && reports
            .filter(r => r.type === 'Flood')
            .map(r => (
              <React.Fragment key={r.id}>
                <Marker position={r.coords} icon={createCustomIcon('💧', 'bg-blue-100 border-blue-400 text-blue-700')}>
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
                <Circle
                  center={r.coords}
                  radius={2500}
                  pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.22, weight: 1.5 }}
                />
              </React.Fragment>
            ))}

          {/* Drones */}
          {showDrones && drones.map(drone => (
            <React.Fragment key={drone.id}>
              <Marker position={drone.coords} icon={createCustomIcon('🛸', 'bg-indigo-100 border-indigo-400 text-indigo-700 animate-bounce')}>
                <Popup>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-indigo-800 flex items-center gap-1">
                      <Navigation size={12} className="rotate-45" />
                      {drone.name}
                    </div>
                    <div>Status: <span className="font-semibold text-emerald-600">{drone.status}</span></div>
                    <div>Battery: <span className="font-bold">{drone.battery.toFixed(0)}%</span></div>
                    <div className="text-[10px] text-slate-400 font-mono">Location: {drone.coords[0].toFixed(4)}, {drone.coords[1].toFixed(4)}</div>
                  </div>
                </Popup>
              </Marker>
              <Polyline positions={drone.path} pathOptions={{ color: '#6366F1', weight: 1.5, dashArray: '5, 8', opacity: 0.6 }} />
            </React.Fragment>
          ))}

          {/* Sensors */}
          {showSensors && sensors.map(sensor => (
            <Marker key={sensor.id} position={sensor.coords} icon={createSensorIcon(sensor.status)}>
              <Popup>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Radio size={12} className="text-indigo-500" />
                    {sensor.name}
                  </div>
                  <div>Water Level: <span className="font-bold">{sensor.value}</span></div>
                  <div>Status: <span className={`font-bold ${sensor.status === 'Critical' ? 'text-red-600' : sensor.status === 'Warning' ? 'text-orange-600' : sensor.status === 'Rising' ? 'text-amber-600' : 'text-emerald-600'}`}>{sensor.status.toUpperCase()}</span></div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {sensor.id}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Static Flood Highlights */}
          {showFloods && (
            <>
              <Circle center={REAL_DATA.locations.odawRiver} radius={2000} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.15, weight: 2 }}>
                <Popup><strong>Odaw River Critical Basin</strong><br />Severe Urban flood zone. Drainage desilting 75% complete.</Popup>
              </Circle>
              <Circle center={REAL_DATA.locations.kwameNkrumahCircle} radius={1200} pathOptions={{ color: '#EF4444', fillColor: '#F59E0B', fillOpacity: 0.25, weight: 1.5 }}>
                <Popup><strong>Kwame Nkrumah Circle Interchange</strong><br />High-density commerce flood hotspot.</Popup>
              </Circle>
            </>
          )}
        </MapContainer>
      </div>

      {/* Floating SOS Info Panel (shows when SOS is active) */}
      {sosAlert && sosSender && (
        <SOSInfoPanel
          sosSender={sosSender}
          sosFeedbacks={sosFeedbacks}
          user={user}
          submitSOSFeedback={submitSOSFeedback}
        />
      )}
    </div>
  );
}
