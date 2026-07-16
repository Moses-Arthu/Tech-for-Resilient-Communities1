import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, AlertOctagon, Flame, Landmark, Activity, CheckCircle, Clock } from 'lucide-react';
import { REAL_DATA } from '../data/realData';

export default function Dashboard() {
  const { reports, apiConnections, alertLogs } = useApp();

  // Compute stats
  const totalArrests = 30; // Real static data count
  const budget = REAL_DATA.budget.amount;
  const destroyedChanfans = "135+";
  const worstRainfall = REAL_DATA.floodStats.rainfall[2].value + "mm";

  return (
    <div className="space-y-6 fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Authority & Community Dashboard</h2>
          <p className="text-slate-500 font-medium">Ghana Environmental Hazard Sentinel (Real Data Platform)</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-sm">
          <Activity size={14} className="animate-pulse" />
          <span>System Live Telemetry</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Shield size={24} className="text-blue-600" />} 
          label="Suspects Arrested" 
          value={totalArrests} 
          subtext="3 Regions (Western/Ashanti/Central)" 
          color="bg-blue-50 border-blue-100 hover:border-blue-200" 
        />
        <StatCard 
          icon={<AlertOctagon size={24} className="text-red-600" />} 
          label="Accra June 2026 Rainfall" 
          value={worstRainfall} 
          subtext="Worst capital flood in years" 
          color="bg-red-50 border-red-100 hover:border-red-200" 
        />
        <StatCard 
          icon={<Flame size={24} className="text-emerald-600" />} 
          label="Destroyed Chanfans" 
          value={destroyedChanfans} 
          subtext="Wassa Gyapa raid operations" 
          color="bg-emerald-50 border-emerald-100 hover:border-emerald-200" 
        />
        <StatCard 
          icon={<Landmark size={24} className="text-amber-600" />} 
          label="NAIMOS Allocation" 
          value={budget} 
          subtext="Anti-galamsey national funding" 
          color="bg-amber-50 border-amber-100 hover:border-amber-200" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="text-emerald-500" size={18} />
            Live Environmental Incident Feed
          </h3>
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className={`p-4 border-l-4 rounded-r-lg bg-slate-50 transition-all hover:bg-slate-100 flex items-start gap-4 ${
                  report.status === 'Verified' ? 'border-emerald-500' :
                  report.status === 'In Progress' ? 'border-amber-500' :
                  report.status === 'Resolved' ? 'border-blue-500' : 'border-slate-400'
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm md:text-base">{report.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      report.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                      report.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                      report.status === 'Resolved' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> {new Date(report.timestamp).toLocaleTimeString()} | <span className="font-semibold text-slate-600">{report.locationName}</span>
                  </p>
                  <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">{report.detail}</p>
                  {report.photo && (
                    <div className="mt-2 text-xs text-indigo-600 font-bold underline">
                      Attached Photographic Evidence (Geo-Tagged)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Telemetry Monitor */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="text-indigo-500" size={18} />
            API Connection Telemetry
          </h3>
          <p className="text-xs text-slate-500">Realtime monitoring of global telemetry integrations.</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(apiConnections).map(([name, status]) => (
              <div key={name} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex flex-col justify-between">
                <span className="font-bold uppercase text-slate-500 tracking-wider text-[10px]">{name} API</span>
                <span className={`mt-1 font-semibold flex items-center gap-1 ${
                  status === 'Connected' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`} />
                  {status}
                </span>
              </div>
            ))}
          </div>
          
          {/* Dual-Alert Log */}
          <div className="mt-6 border-t pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dual-Alert Dispatch Logs</h4>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {alertLogs.slice(0, 3).map(log => (
                <div key={log.id} className="text-[11px] p-2 bg-slate-900 text-slate-300 rounded font-mono">
                  <div className="text-emerald-400 font-bold">[{log.type}] {"→"} {log.recipient}</div>
                  <div className="mt-0.5 text-slate-400 line-clamp-1">{log.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Technology Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Strategic Framework Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="text-xs uppercase bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Approach Area</th>
                <th scope="col" className="px-6 py-3">Current Traditional Method</th>
                <th scope="col" className="px-6 py-3 text-emerald-700 bg-emerald-50">Our Solution Framework</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REAL_DATA.techComparison.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{item.approach}</td>
                  <td className="px-6 py-4 text-slate-600">{item.current}</td>
                  <td className="px-6 py-4 text-slate-800 font-semibold bg-emerald-50/40 text-emerald-800">{item.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }) {
  return (
    <div className={`${color} p-5 rounded-xl border shadow-sm transition-all hover:-translate-y-0.5 duration-200 flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div>{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        <div className="text-xs text-slate-500 font-semibold mt-1">{subtext}</div>
      </div>
    </div>
  );
}
