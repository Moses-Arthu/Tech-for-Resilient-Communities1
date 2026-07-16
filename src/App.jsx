import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

// Lucide Icons
import {
  LayoutDashboard, Map, CloudRain,
  Pickaxe, AlertTriangle, Bell, ClipboardList,
  UserCheck, User, Navigation, ShieldCheck
} from 'lucide-react';

function AppShell() {
  const { sosAlert, user } = useApp();

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 ${
      sosAlert ? 'bg-red-50/50' : 'bg-slate-50'
    }`}>
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
            <SidebarLink to="/alerts" icon={<Bell size={16} />} label="Dispatches" />
            <SidebarLink to="/my-reports" icon={<ClipboardList size={16} />} label="My Submissions" />
            <SidebarLink to="/drones" icon={<Navigation size={16} />} label="Drone Fleet" />
            
            {/* Conditional Admin/Responder Links */}
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
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                : 'bg-red-700 hover:bg-red-800 text-slate-100'
            }`}
          >
            SOS Beacon
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
            <Link to="/sos" className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              sosAlert ? 'bg-red-600 text-white animate-pulse' : 'bg-red-700 text-white'
            }`}>
              SOS
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
          <MobileLink to="/report" icon={<AlertTriangle size={18} />} label="Report" />
        </nav>
      </div>

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
        `flex flex-col items-center gap-1 py-1 transition-colors ${
          isActive ? 'text-indigo-400' : 'text-slate-500'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function AppContent() {
  const { user } = useApp();
  if (!user || !user.isAuthenticated) {
    return <Auth />;
  }
  return <AppShell />;
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
