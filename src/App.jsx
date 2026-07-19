import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Services
import { wsService } from './services/WebSocketService';
import { UserService } from './services/UserService';
import { AlertReceiverService } from './services/AlertReceiverService';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, messaging } from './firebase/config';
import { onMessage } from 'firebase/messaging';

// Import Pages
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import FloodPrediction from './pages/FloodPrediction';
import FloodPrevention from './pages/FloodPrevention';
import MiningDetection from './pages/MiningDetection';
import ReportForm from './pages/ReportForm';
import Alerts from './pages/Alerts';
import MyReports from './pages/MyReports';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import SOS from './pages/SOS';
import DroneManagement from './pages/DroneManagement';
import Auth from './pages/Auth';
import ChatbotPage from './pages/ChatbotPage';

// Lucide Icons
import {
  LayoutDashboard, Map, CloudRain,
  Pickaxe, AlertTriangle, Bell, ClipboardList,
  UserCheck, User, Navigation, ShieldCheck,
  ShieldAlert, MessageCircle, Send, X, BellRing,
  MapPin, Activity, Bot
} from 'lucide-react';

// ─── Global SOS Overlay Modal ────────────────────────────────────────────────
// Shows to every user on every page when a SOS is active
function GlobalSOSOverlay() {
  const { sosAlert, sosSender, sosFeedbacks, user, submitSOSFeedback, broadcastSOS } = useApp();
  const navigate = useNavigate();
  const [feedbackText, setFeedbackText] = useState('');
  const [minimized, setMinimized] = useState(false);

  // Reset minimized state on new SOS
  useEffect(() => {
    if (sosAlert) setMinimized(false);
  }, [sosAlert]);

  if (!sosAlert || !sosSender) return null;

  const isSelf = sosSender.phone === user.phone;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    submitSOSFeedback(feedbackText);
    setFeedbackText('');
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-20 md:bottom-6 right-4 z-[9999] bg-red-600 hover:bg-red-500 text-white rounded-full px-4 py-2.5 shadow-2xl border-2 border-white flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all animate-pulse"
      >
        <ShieldAlert size={14} />
        SOS ACTIVE
        <span className="bg-white text-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
          {sosFeedbacks.length}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[9999] w-80 max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden shadow-2xl border-2 border-red-500/60 slide-up"
      style={{ background: 'linear-gradient(160deg, #1a0505 0%, #0f172a 100%)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-red-900/70 border-b border-red-700/40 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
        <ShieldAlert size={13} className="text-red-300 shrink-0 animate-pulse" />
        <span className="text-red-200 font-black text-xs uppercase tracking-widest truncate flex-1">
          🚨 SOS — {sosSender.name}
        </span>
        <button
          onClick={() => setMinimized(true)}
          className="text-slate-400 hover:text-white transition-colors ml-1"
          title="Minimize"
        >
          <X size={14} />
        </button>
      </div>

      {/* Sender info */}
      <div className="px-4 py-2.5 flex items-center gap-2.5 border-b border-slate-700/40">
        <MapPin size={13} className="text-red-400 shrink-0 animate-bounce" />
        <div className="min-w-0 flex-1">
          <div className="text-white font-bold text-[10px]">
            {isSelf ? 'Your location is being broadcast' : `${sosSender.name} needs help!`}
          </div>
          <div className="text-slate-400 font-mono text-[9px]">
            {sosSender.coords[0].toFixed(5)}°N, {sosSender.coords[1].toFixed(5)}°E
          </div>
        </div>
        <div className="flex items-center gap-1 text-red-400 text-[9px] font-black">
          <Activity size={9} className="animate-spin" />
          LIVE
        </div>
      </div>

      {/* Feedbacks preview */}
      <div className="px-4 py-2.5 border-b border-slate-700/40">
        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
          <MessageCircle size={9} />
          Responses ({sosFeedbacks.length})
        </div>
        <div className="space-y-2 max-h-24 overflow-y-auto custom-scroll">
          {sosFeedbacks.length === 0 ? (
            <p className="text-slate-500 text-[10px] italic">No responses yet…</p>
          ) : (
            sosFeedbacks.slice(0, 5).map(fb => (
              <div key={fb.id} className="flex gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <User size={8} className="text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-indigo-300 font-bold text-[9px]">{fb.senderName}: </span>
                  <span className="text-slate-300 text-[9px] break-words">{fb.text}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Response form — only for non-senders */}
      {!isSelf && (
        <form onSubmit={handleSubmit} className="px-4 py-3 flex gap-2">
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
        </form>
      )}

      {/* Action buttons */}
      <div className={`px-4 pb-3 flex gap-2 ${!isSelf ? '' : 'pt-3'}`}>
        <button
          onClick={() => navigate('/map')}
          className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
        >
          <MapPin size={10} /> View on Map
        </button>
        {isSelf && (
          <button
            onClick={() => broadcastSOS(false)}
            className="flex-1 py-1.5 bg-slate-700 hover:bg-red-800 text-slate-300 hover:text-white text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <X size={10} /> Cancel SOS
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Push Notification Permission Banner ─────────────────────────────────────
function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Show after a short delay so the page is settled
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  const handleAllow = async () => {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      new Notification('✅ SOS Alerts Enabled', {
        body: 'You will now receive instant browser notifications for SOS emergencies on the platform.',
      });
    }
    setShow(false);
  };

  return (
    <div className="notif-banner fixed top-0 left-0 right-0 z-[10000] px-4 py-2.5 flex items-center gap-3 text-white text-xs font-semibold shadow-lg">
      <BellRing size={15} className="shrink-0 animate-bounce" />
      <span className="flex-1">
        <strong>Enable browser notifications</strong> to receive instant SOS emergency alerts even when you are on another tab.
      </span>
      <button
        onClick={handleAllow}
        className="px-3 py-1 bg-white text-blue-700 font-black rounded-md text-[10px] uppercase tracking-wider hover:bg-blue-50 transition-all shrink-0"
      >
        Allow Alerts
      </button>
      <button onClick={() => setShow(false)} className="text-blue-200 hover:text-white transition-colors shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

function AppShell() {
  const { sosAlert, user } = useApp();

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 ${sosAlert ? 'sos-flash-border bg-red-50/30' : 'bg-slate-50'}`}>
      <NotificationPermissionBanner />

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 shadow-xl justify-between">
        <div className="p-5 space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <ShieldCheck className="text-emerald-400 shrink-0" size={28} />
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase leading-none text-slate-100">Resilient Ghana</h1>
              <span className="text-[9px] font-bold text-slate-500 tracking-wider">Hazard Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-extrabold uppercase tracking-wider">
            <SidebarLink to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" />
            <SidebarLink to="/map" icon={<Map size={16} />} label="Live Map" />
            <SidebarLink to="/flood" icon={<CloudRain size={16} />} label="Flood Predict" />
            <SidebarLink to="/prevention" icon={<ShieldCheck size={16} />} label="Flood Prevention" />
            <SidebarLink to="/mining" icon={<Pickaxe size={16} />} label="Mining Sentinel" />
            <SidebarLink to="/report" icon={<AlertTriangle size={16} />} label="Citizen Report" />
            <SidebarLink to="/chatbot" icon={<Bot size={16} />} label="AI Assistant" />
            <SidebarLink to="/alerts" icon={<Bell size={16} />} label="Dispatches" />
            <SidebarLink to="/my-reports" icon={<ClipboardList size={16} />} label="My Submissions" />
            <SidebarLink to="/drones" icon={<Navigation size={16} />} label="Drone Fleet" />

            {(user.role === 'Admin' || user.role === 'Authority' || user.role === 'Responder') && (
              <SidebarLink to="/admin" icon={<UserCheck size={16} />} label="Admin Panel" />
            )}
          </nav>
        </div>

        {/* SOS quick action & Profile footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            to="/sos"
            className={`w-full py-2.5 rounded-lg font-black text-xs text-center block transition-all shadow-sm tracking-wider uppercase ${
              sosAlert
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-900/50'
                : 'bg-red-700 hover:bg-red-800 text-slate-100'
            }`}
          >
            {sosAlert ? '🚨 SOS ACTIVE' : 'SOS Beacon'}
          </Link>

          <Link to="/profile" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-left text-xs font-semibold text-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200">
              <User size={16} />
            </div>
            <div>
              <div className="font-extrabold text-slate-200 line-clamp-1">{user.name || 'Sign In'}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">{user.role}</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar for Mobile */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="text-emerald-400" size={24} />
            <span className="font-black text-xs uppercase tracking-wider">Resilient Ghana</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/sos"
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                sosAlert ? 'bg-red-600 text-white animate-pulse' : 'bg-red-700 text-white'
              }`}
            >
              {sosAlert ? '🚨 SOS' : 'SOS'}
            </Link>
            <Link to="/profile" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <User size={14} />
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/flood" element={<FloodPrediction />} />
            <Route path="/prevention" element={<FloodPrevention />} />
            <Route path="/mining" element={<MiningDetection />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/drones" element={<DroneManagement />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/sos" element={<SOS />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-400 p-2 flex justify-around items-center z-[1000] text-[9px] font-extrabold uppercase tracking-wide">
          <MobileLink to="/" icon={<LayoutDashboard size={18} />} label="Home" />
          <MobileLink to="/map" icon={<Map size={18} />} label="Map" />
          <MobileLink to="/flood" icon={<CloudRain size={18} />} label="Forecast" />
          <MobileLink to="/mining" icon={<Pickaxe size={18} />} label="Mining" />
          <MobileLink to="/chatbot" icon={<Bot size={18} />} label="AI Chat" />
          <MobileLink to="/report" icon={<AlertTriangle size={18} />} label="Report" />
        </nav>
      </div>

      {/* Global SOS floating widget — visible on every page */}
      <GlobalSOSOverlay />

      <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
    </div>
  );
}

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
        }`
      }
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function MobileLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500'}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function ServiceInitializer() {
  const { user } = useApp();

  useEffect(() => {
    if (user && user.isAuthenticated) {
      // 1. Update user profile in Firestore
      UserService.registerOrUpdateUser(user);

      // 2. Connect WebSocket
      wsService.connect(user);

      // 3. Listen for WebSocket SOS events
      const handleSOS = (data) => AlertReceiverService.handleIncomingSOS(data);
      const handleFeedback = (data) => AlertReceiverService.handleIncomingFeedback(data);
      
      wsService.on('SOS_ALERT', handleSOS);
      wsService.on('SOS_FEEDBACK', handleFeedback);

      // 4. Request Notifications
      AlertReceiverService.requestNotificationPermission();

      // 5. Subscribe to Firestore real-time updates for SOS
      const q = query(collection(db, 'alerts'), where('status', '==', 'ACTIVE'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.userId !== user.phone) {
              AlertReceiverService.handleIncomingSOS({
                name: data.userName,
                coords: data.location
              });
            }
          }
        });
      });

      // 6. Listen for FCM
      if (messaging) {
        onMessage(messaging, (payload) => {
          AlertReceiverService.showBrowserNotification(
            payload.notification?.title || 'Alert',
            payload.notification?.body || ''
          );
        });
      }

      return () => {
        wsService.off('SOS_ALERT', handleSOS);
        wsService.off('SOS_FEEDBACK', handleFeedback);
        wsService.disconnect();
        unsubscribe();
      };
    }
  }, [user]);

  return null;
}

function AppContent() {
  const { user } = useApp();
  if (!user || !user.isAuthenticated) return <Auth />;
  return (
    <>
      <ServiceInitializer />
      <AppShell />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}
