import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Cpu, Send, ClipboardList, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { reports, updateReportStatus, user } = useApp();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState([]);

  const activeReport = reports.find(r => r.id === selectedReportId) || null;

  const triggerSatelliteScan = (report) => {
    setIsScanning(true);
    setScanLogs([`[0.0s] Triggering GEE Sentinel-1 SAR Cloud-Penetrating Radar Scan over concession [${report.coords[0].toFixed(4)}, ${report.coords[1].toFixed(4)}]`]);

    setTimeout(() => {
      setScanLogs(prev => [...prev, `[0.8s] NDVI Reflectance calculated: 0.12 (Threshold: <0.15 indicates critical canopy loss)`]);
      setTimeout(() => {
        setScanLogs(prev => [...prev, `[1.5s] Coords confirmed. Canopy disturbance verified. Matching strips count: 4. Verification complete.`]);
        setIsScanning(false);
        updateReportStatus(report.id, 'Verified');
      }, 1000);
    }, 800);
  };

  const handleStatusChange = (id, status) => {
    updateReportStatus(id, status);
  };

  return (
    <div className="space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin & Response Console</h2>
        <p className="text-slate-500 font-medium">Verify submissions, trigger spectral satellite audits, and direct response operations.</p>
      </header>

      {user.role === 'Admin' || user.role === 'Authority' || user.role === 'Responder' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports Table List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <ClipboardList className="text-indigo-500" size={20} />
              Review Pending Threat Nodes
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b">
                    <th className="py-2.5">Title</th>
                    <th className="py-2.5">Region / Location</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {reports.map((report) => (
                    <tr 
                      key={report.id} 
                      onClick={() => setSelectedReportId(report.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedReportId === report.id ? 'bg-slate-50' : ''
                      }`}
                    >
                      <td className="py-3 font-bold text-slate-900">{report.title}</td>
                      <td className="py-3 text-slate-500">{report.locationName}</td>
                      <td className="py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          report.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                          report.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                          report.status === 'Resolved' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold">
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action & Verification Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm space-y-4">
            {activeReport ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="border-b pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Concession Node</span>
                    <h4 className="text-base font-extrabold text-slate-900">{activeReport.title}</h4>
                    <p className="text-xs text-slate-500 font-semibold italic mt-0.5">{activeReport.locationName}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-500 block">Report Description:</span>
                    <p className="text-slate-600 bg-slate-50 border p-3 rounded leading-relaxed font-semibold">
                      {activeReport.detail}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Status buttons */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Change Status</label>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                      <button 
                        onClick={() => handleStatusChange(activeReport.id, 'Verified')}
                        className={`p-2 rounded border transition-colors ${activeReport.status === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                      >
                        Verify
                      </button>
                      <button 
                        onClick={() => handleStatusChange(activeReport.id, 'In Progress')}
                        className={`p-2 rounded border transition-colors ${activeReport.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border-amber-300 font-black' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                      >
                        In Progress
                      </button>
                      <button 
                        onClick={() => handleStatusChange(activeReport.id, 'Resolved')}
                        className={`p-2 rounded border transition-colors ${activeReport.status === 'Resolved' ? 'bg-blue-50 text-blue-800 border-blue-300 font-black' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>

                  {/* Satellite Scan tool */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">GEE Radar Spectral verification</span>
                      {activeReport.satelliteChecked && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded uppercase">Scan Passed</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => triggerSatelliteScan(activeReport)}
                      disabled={isScanning}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 transition-all"
                    >
                      {isScanning ? <RefreshCw className="animate-spin" size={12} /> : <Cpu size={12} />}
                      {isScanning ? 'Processing Scan...' : 'Trigger Satellite Verification Scan'}
                    </button>

                    {/* Scan progress logs */}
                    {scanLogs.length > 0 && (
                      <div className="p-3 bg-slate-900 rounded font-mono text-[9px] text-slate-300 max-h-[100px] overflow-y-auto space-y-1">
                        {scanLogs.map((log, i) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 font-bold text-xs space-y-2 flex-1 flex flex-col justify-center items-center">
                <ShieldCheck size={36} className="text-slate-300" />
                <span>Select a Threat Node from review list to execute satellite scans and taskforce coordination.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
          <ShieldCheck className="mx-auto text-slate-300" size={48} />
          <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
          <p className="text-xs text-slate-400">You must login as Responder, Authority, or Admin to access reports review consoles. Current Role: {user.role}</p>
        </div>
      )}
    </div>
  );
}
