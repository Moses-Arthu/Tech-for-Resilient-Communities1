import React from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList, Navigation, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function MyReports() {
  const { reports, user } = useApp();

  // Filter reports submitted by the active user's phone number
  const myReports = reports.filter(r => r.reporterPhone === user.phone);

  const getStatusText = (status) => {
    if (status === 'Pending') return 'Awaiting satellite validation...';
    if (status === 'Verified') return 'Satellite confirmed. Responders alert dispatched.';
    if (status === 'In Progress') return 'Enforcement forces dispatched to scene.';
    return 'Operation completed successfully.';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Dispatched Reports</h2>
        <p className="text-slate-500 font-medium">Tracking device submissions, satellite validations, and responder coordination feedback.</p>
      </header>

      {myReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
          <ClipboardList className="mx-auto text-slate-300" size={48} />
          <h3 className="text-base font-bold text-slate-800">No Filed Incidents</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">You have not registered any emergency reports under this phone number: {user.phone}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className={report.type === 'Mining' ? 'text-red-500' : 'text-blue-500'} size={18} />
                    {report.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Tracking Node ID: <span className="font-mono text-slate-600 font-black">{report.id}</span> | Filed: {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    report.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    report.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    report.status === 'Resolved' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Description & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-600">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Reporter Incident Log Details</span>
                    <p className="mt-1 text-slate-700 leading-relaxed text-sm">{report.detail}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">GPS Captured Coordinates</span>
                    <div className="mt-1 bg-slate-50 border p-2 rounded font-mono text-[11px] text-slate-700 flex items-center justify-between">
                      <span>Coordinates: [{report.coords[0].toFixed(5)}, {report.coords[1].toFixed(5)}]</span>
                      <span className="text-[10px] text-indigo-600 font-bold italic">{report.locationName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 h-fit space-y-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Response Status</span>
                  <div className="text-slate-800 font-bold leading-relaxed">{getStatusText(report.status)}</div>
                </div>
              </div>

              {/* Step Pipeline Tracker */}
              <div className="border-t pt-4">
                <h4 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-4">Verification Pipeline Steps</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <StepBubble label="1. Filed" active={true} desc="GPS geotag logged" />
                  <StepBubble label="2. Sat Verified" active={report.satelliteChecked} desc="GEE NDVI check" />
                  <StepBubble label="3. Dispatched" active={report.alertsSent} desc="SMS + Push alert" />
                  <StepBubble label="4. Actioned" active={report.status === 'Resolved'} desc="Taskforce sweep" />
                </div>
              </div>

              {/* Feedback Loop Log */}
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                  <Navigation size={12} className="rotate-45" />
                  Feedback Loop Log (Realtime Tracking)
                </div>
                <div>[00:00:00] Report submitted at location: {report.coords[0].toFixed(4)}, {report.coords[1].toFixed(4)}</div>
                {report.satelliteChecked && (
                  <div>[00:00:03] Status updated: verified by Sentinel-1 radar cross-checks. Alert dispatched to nearby responder unit.</div>
                )}
                {report.status === 'In Progress' && (
                  <div>[00:15:30] Status updated: unit dispatched to scene. Coordinating local deployment parameters.</div>
                )}
                {report.status === 'Resolved' && (
                  <div>[02:40:00] Status updated: resolved. Arrest operations completed. Chanfans destroyed. Concession cleared.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepBubble({ label, active, desc }) {
  return (
    <div className="flex flex-col items-center space-y-1.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
        active 
          ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100' 
          : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}>
        {active ? <CheckCircle2 size={16} /> : <Clock size={16} />}
      </div>
      <div>
        <div className={`text-xs font-black ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</div>
        <div className="text-[10px] text-slate-400 font-medium">{desc}</div>
      </div>
    </div>
  );
}
