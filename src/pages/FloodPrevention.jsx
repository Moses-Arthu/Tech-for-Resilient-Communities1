import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { REAL_DATA } from '../data/realData';
import { CheckSquare, Square, ShieldCheck, ChevronRight, Activity, MapPin } from 'lucide-react';

export default function FloodPrevention() {
  const { checklists, toggleChecklistItem } = useApp();
  const [selectedRegion, setSelectedRegion] = useState('accra');

  // Calculate percentage progress for each region
  const calculateProgress = (regionKey) => {
    const list = checklists[regionKey] || [];
    if (list.length === 0) return 0;
    const completed = list.filter(item => item.status === 'Done').length;
    const inProgress = list.filter(item => item.status === 'In Progress').length;
    // Done counts 100%, In Progress counts 50%
    const score = (completed * 100 + inProgress * 50) / list.length;
    return Math.round(score);
  };

  const getStatusIcon = (status) => {
    if (status === 'Done') return <CheckSquare className="text-emerald-600 shrink-0" size={18} />;
    if (status === 'In Progress') return <Square className="text-amber-500 bg-amber-50 shrink-0" size={18} />;
    return <Square className="text-slate-300 shrink-0" size={18} />;
  };

  return (
    <div className="space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Regional Flood Prevention</h2>
        <p className="text-slate-500 font-medium">Tracking physical prevention checklists and infrastructure audits across major risk zones.</p>
      </header>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.keys(checklists).map((regionKey) => {
          const progress = calculateProgress(regionKey);
          const name = regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
          const isActive = selectedRegion === regionKey;
          
          return (
            <button
              key={regionKey}
              onClick={() => setSelectedRegion(regionKey)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between shadow-sm transition-all ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-700 text-white ring-2 ring-indigo-200' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                  <MapPin size={12} />
                  {name}
                </span>
                <ChevronRight size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
              </div>
              
              <div className="mt-4 space-y-2 w-full">
                <div className="text-2xl font-black">{progress}%</div>
                <div className="w-full bg-slate-100/30 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isActive ? 'bg-white' : 'bg-indigo-600'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="text-[10px] opacity-75 font-semibold">Prevention Audit Status</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Checklist and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <ShieldCheck className="text-indigo-500" size={20} />
            {selectedRegion.toUpperCase()} Drainage & Defense Checklist
          </h3>
          <p className="text-xs text-slate-500">Click items to cycle status: <span className="text-slate-300 font-bold">Not Started</span> → <span className="text-amber-500 font-bold">In Progress</span> → <span className="text-emerald-600 font-bold">Done</span>.</p>
          
          <div className="space-y-2">
            {(checklists[selectedRegion] || []).map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(selectedRegion, item.id)}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer font-medium text-slate-700 text-xs md:text-sm"
              >
                {getStatusIcon(item.status)}
                <span className={item.status === 'Done' ? 'line-through text-slate-400 font-normal' : ''}>
                  {item.task}
                </span>
                <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  item.status === 'Done' ? 'bg-emerald-100 text-emerald-800' :
                  item.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Region Specific Official Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="text-amber-500 animate-pulse" size={18} />
              Mitigation Directives
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Official engineering guidelines and relocation advisories.</p>
          </div>
          
          <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-lg text-xs leading-relaxed font-semibold">
            {REAL_DATA.regionRecommendations[selectedRegion]}
          </div>

          <div className="text-[10px] text-slate-400 font-bold border-t pt-3">
            Source: Ministry of Works, Housing and Water Resources, Ghana.
          </div>
        </div>
      </div>

      {/* Prevention Strategy Matrix (Low to Severe) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Mitigation Roadmap Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm text-slate-500">
            <thead className="text-xs uppercase bg-slate-50 text-slate-700 font-bold border-b">
              <tr>
                <th scope="col" className="px-4 py-3">Risk Level</th>
                <th scope="col" className="px-4 py-3">Short-term (Immediate)</th>
                <th scope="col" className="px-4 py-3">Medium-term (1-6 months)</th>
                <th scope="col" className="px-4 py-3">Long-term (6+ months)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-4 text-emerald-600 font-bold">LOW</td>
                <td className="px-4 py-4 text-slate-600">Community awareness, pamphlets distribution</td>
                <td className="px-4 py-4 text-slate-600">Regular gutter clearing & silt removal</td>
                <td className="px-4 py-4 text-slate-600">Drainage expansion infrastructure audits</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-4 text-yellow-600 font-bold">MODERATE</td>
                <td className="px-4 py-4 text-slate-600">Clear drains, distribute sandbags, alert nodes</td>
                <td className="px-4 py-4 text-slate-600">Desilt river beds, repair minor retaining walls</td>
                <td className="px-4 py-4 text-slate-600">Construct localized stormwater retention ponds</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-4 text-orange-600 font-bold">HIGH</td>
                <td className="px-4 py-4 text-slate-600">Activate local shelters, broadcast radio warning</td>
                <td className="px-4 py-4 text-slate-600">Construct retention dams, tree planting campaigns</td>
                <td className="px-4 py-4 text-slate-600">Relocate highly vulnerable low-lying settlements</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-4 text-red-600 font-bold">SEVERE</td>
                <td className="px-4 py-4 text-slate-600">IMMEDIATE EMERGENCY EVACUATION directives</td>
                <td className="px-4 py-4 text-slate-600">Deploy military rescue craft and set up field hospitals</td>
                <td className="px-4 py-4 text-slate-600">Enact flood-resilient code standards for rebuilding</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
