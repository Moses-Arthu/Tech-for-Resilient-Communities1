import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, PhoneCall, Radio, Send, BellRing, Clock, UserCheck } from 'lucide-react';

export default function Alerts() {
  const { alertLogs, user } = useApp();
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredLogs = alertLogs.filter(log => {
    if (activeTab === 'all') return true;
    return log.type.toLowerCase() === activeTab.toLowerCase();
  });

  const handleManualBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;
    alert(`Broadcast Sent: ${broadcastTitle}\nBody: ${broadcastBody}\nDispatched to all local subscribers.`);
    setBroadcastTitle('');
    setBroadcastBody('');
  };

  return (
    <div className="space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dual-Alert Dispatch Center</h2>
        <p className="text-slate-500 font-medium">Telemetry logs for security dispatch (Twilio SMS & Firebase Push Alerts).</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BellRing className="text-indigo-500" size={18} />
              Transmission Log Feed
            </h3>
            
            {/* Tab Filters */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveTab('sms')}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'sms' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                SMS (Twilio)
              </button>
              <button 
                onClick={() => setActiveTab('push')}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'push' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Push (FCM)
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-medium text-sm">No alert records match selection.</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    log.type === 'SMS' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {log.type === 'SMS' ? <PhoneCall size={16} /> : <Mail size={16} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700">{log.recipient}</span>
                      <span className="text-slate-400 flex items-center gap-1 font-medium font-mono">
                        <Clock size={11} />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 font-mono bg-white p-2.5 rounded border border-slate-100 leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dispatch Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-fit space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Radio className="text-red-500" size={18} />
              Manual Emergency Broadcast
            </h3>
            <p className="text-xs text-slate-400">Authorized roles only. Broadcast triggers SMS push notifications to regional nodes.</p>
          </div>

          {user.role === 'Authority' || user.role === 'Admin' ? (
            <form onSubmit={handleManualBroadcast} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Alert Broadcast Topic</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Heavy Rain Warning: Odaw Basin" 
                  value={broadcastTitle} 
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Broadcast Details (Max 160 characters)</label>
                <textarea 
                  required
                  rows={4}
                  maxLength={160}
                  placeholder="e.g., Evacuation alert for residents near Circle. Water levels have surpassed 1.5m at gauge sensor A. Seek higher ground."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow flex items-center justify-center gap-2 transition-all"
              >
                <Send size={12} />
                Dispatch Regional Alert
              </button>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 border rounded-lg text-center space-y-2">
              <UserCheck size={28} className="text-slate-400 mx-auto" />
              <div className="text-xs font-extrabold text-slate-700">Access Denied</div>
              <p className="text-[10px] text-slate-400">Only Authority or Admin accounts can execute manual emergency broadcasts. Current role: {user.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
