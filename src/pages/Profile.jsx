import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, ShieldCheck, LogOut, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, login, logout } = useApp();
  const [phoneInput, setPhoneInput] = useState(user.phone || '');
  const [roleInput, setRoleInput] = useState(user.role || 'Citizen');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(phoneInput, roleInput);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Profile & Roles</h2>
        <p className="text-slate-500 font-medium">Manage phone registration credentials and security access clearance permissions.</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        {user.isAuthenticated ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Header indicator */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{user.name}</h3>
                <span className="inline-block mt-0.5 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Role Clearance: {user.role}
                </span>
              </div>
            </div>

            {/* Phone input */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Registered Phone Identifier (SMS Alert recipient)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="tel" 
                  required
                  placeholder="+233 24 555 1234" 
                  value={phoneInput} 
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Role selection simulator */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Simulated Role Access Permission</label>
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-700"
              >
                <option value="Citizen">Citizen (Submit report alerts)</option>
                <option value="Responder">Responder (SMS dispatch logs check)</option>
                <option value="Authority">Authority (Issue warnings, full audit)</option>
                <option value="Admin">Admin (Trigger GEE radar scans)</option>
              </select>
            </div>

            {showSavedToast && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle size={14} /> Profile and Role permissions updated successfully.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow transition-all"
              >
                Save Profile Parameters
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 border hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <ShieldCheck className="mx-auto text-slate-300 animate-pulse" size={48} />
            <div>
              <h3 className="font-bold text-slate-800">Registration Portal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Please sign in to log environmental issues.</p>
            </div>
            <button
              onClick={() => login('+233 24 555 1234', 'Citizen')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-all"
            >
              Sign In (Quick Simulation Auth)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
