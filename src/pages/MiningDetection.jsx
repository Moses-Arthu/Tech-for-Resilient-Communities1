import React, { useState, useEffect } from 'react';
import { REAL_DATA } from '../data/realData';
import { ShieldAlert, AlertTriangle, Eye, Compass, FlaskConical, Award } from 'lucide-react';

export default function MiningDetection() {
  const [ndvi, setNdvi] = useState(0.45);
  const [ndviStatus, setNdviStatus] = useState({ label: 'Safe', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Dense canopy forest. Healthy vegetation detected.' });

  // Update NDVI status on slider drag
  useEffect(() => {
    const val = parseFloat(ndvi);
    if (val >= 0.40) {
      setNdviStatus({ label: 'Safe (Healthy Canopy)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Dense vegetation, standard buffer parameters. No logging detected.' });
    } else if (val >= 0.25) {
      setNdviStatus({ label: 'Watch (Early Clearing)', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', desc: 'Sparse foliage clearing detected. Possible logging paths or exploratory tracks.' });
    } else if (val >= 0.15) {
      setNdviStatus({ label: 'Warning (Active Disturbance)', color: 'text-orange-700 bg-orange-50 border-orange-200', desc: 'High ground exposure. Excavation signatures matching alluvial strip mining.' });
    } else {
      setNdviStatus({ label: 'Critical (Active Galamsey)', color: 'text-red-700 bg-red-50 border-red-200', desc: 'Total canopy depletion. High turbidity runoff pathways and mining pits verified.' });
    }
  }, [ndvi]);

  return (
    <div className="space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Satellite Galamsey Detection</h2>
        <p className="text-slate-500 font-medium">Processing radar (Sentinel-1 SAR) and multi-spectral vegetation indices (NDVI) for forest audits.</p>
      </header>

      {/* Chemical Contamination levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PollutionCard 
          river="River Nyam (Obuasi)" 
          pollutant="Arsenic Contamination" 
          value={REAL_DATA.pollution.riverNyam.arsenic} 
          limit={REAL_DATA.pollution.riverNyam.limit} 
          ratio={REAL_DATA.pollution.riverNyam.ratio} 
          desc="Severe industrial chemical runoff, exceeding safety thresholds by 1,356 times."
        />
        <PollutionCard 
          river="River Asuakoo" 
          pollutant="Manganese Contamination" 
          value={REAL_DATA.pollution.riverAsuakoo.manganese} 
          limit={REAL_DATA.pollution.riverAsuakoo.limit} 
          ratio={REAL_DATA.pollution.riverAsuakoo.ratio} 
          desc="Heavy metal poisoning matching mining tailing discharge, 57 times above WHO guidelines."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NDVI Slider Analyzer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Eye className="text-emerald-600 animate-pulse" size={20} />
              NDVI Vegetation Index Simulator (GEE Platform)
            </h3>
            <p className="text-xs text-slate-400 mt-1">Adjust index to simulate satellite spectral reflectivity over dense concessions.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Normalized Difference Vegetation Index</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.80" 
                  step="0.01" 
                  value={ndvi} 
                  onChange={(e) => setNdvi(e.target.value)}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="font-mono font-black text-slate-800 shrink-0 text-sm">NDVI: {parseFloat(ndvi).toFixed(2)}</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg border flex flex-col gap-1 transition-all duration-200 ${ndviStatus.color}`}>
              <div className="text-xs font-black uppercase tracking-wider">Classification: {ndviStatus.label}</div>
              <p className="text-xs font-semibold leading-relaxed">{ndviStatus.desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-center uppercase tracking-wider text-slate-400">
            <div className="p-1 border rounded bg-emerald-50 text-emerald-800 border-emerald-100">Safe (&gt;0.4)</div>
            <div className="p-1 border rounded bg-yellow-50 text-yellow-800 border-yellow-100">Watch (0.25-0.4)</div>
            <div className="p-1 border rounded bg-orange-50 text-orange-800 border-orange-100 font-bold">Warning (0.15-0.25)</div>
            <div className="p-1 border rounded bg-red-50 text-red-800 border-red-100">Critical (&lt;0.15)</div>
          </div>
        </div>

        {/* MAAP Peru Model Validation */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="text-amber-500" size={18} />
              MAAP Peru Validation
            </h3>
            <p className="text-xs text-slate-400">Proven model for anti-deforestation enforcement.</p>
          </div>
          
          <div className="text-xs leading-relaxed text-slate-600 space-y-2 font-semibold">
            <p>
              The **MAAP Peru Model** reduced illegal gold-mining deforestation by up to **90%** in targeted buffer zones.
            </p>
            <p className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-slate-500">
              Methodology: Combined daily Planet satellite alerts, Sentinel-1 radar, and local drone dispatch to arrest clearing teams.
            </p>
            <p className="text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 text-[11px] font-bold">
              "If Peru achieved a 90% reduction, Ghana's NAIMOS taskforce can achieve similar efficiency using automated GPS alerting."
            </p>
          </div>
        </div>
      </div>

      {/* Police Arrest Records & Sweeps */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FlaskConical size={18} className="text-blue-500" />
          Official Police Arrest Records & Site Audits (Real Data)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarkwa (Huniso)</span>
            <div className="text-xl font-black text-slate-800">13 Remanded</div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">Suspects arrested and remanded by the Tarkwa Circuit Court. Concessions seized.</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Obuasi (Akrokerri)</span>
            <div className="text-xl font-black text-slate-800">9 Arrested</div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">Illegal mine 200m from Asare Bediako SHS. Blast explosives caused heavy structural damage to school property.</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dunkwa-On-Offin</span>
            <div className="text-xl font-black text-slate-800">2 Excavators Seized</div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">Suspects arrested operating heavy excavation machinery directly within the bed of the River Offin.</p>
          </div>
        </div>

        <div className="mt-4 p-3.5 bg-slate-900 text-slate-300 rounded-lg text-xs leading-relaxed font-semibold font-mono flex items-center justify-between">
          <span>Deployment Profile: Chief Superintendent William Jabialu + 73 Officers + 9 Seniors</span>
          <span className="text-emerald-400 font-bold uppercase text-[10px]">Operation Active</span>
        </div>
      </div>
    </div>
  );
}

function PollutionCard({ river, pollutant, value, limit, ratio, desc }) {
  return (
    <div className="bg-white p-5 rounded-xl border-l-8 border-red-600 border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{river}</span>
        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-full uppercase tracking-wide">
          {ratio} Over Limit
        </span>
      </div>
      <div>
        <h4 className="text-lg font-extrabold text-slate-800">{pollutant}</h4>
        <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">WHO Maximum Permit: {limit}</div>
      </div>
      <p className="text-xs text-slate-600 font-semibold border-t pt-2 mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}
