import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  ChevronRight, 
  Activity, 
  MapPin,
  AlertTriangle,
  Droplets,
  Trees,
  Building,
  Clock
} from 'lucide-react';

export default function FloodPrevention() {
  const { checklists, toggleChecklistItem } = useApp();
  const [selectedRegion, setSelectedRegion] = useState('accra');
  const [animatedProgress, setAnimatedProgress] = useState({});

  // ─── Region Data ────────────────────────────────────────────────────────────
  const regions = {
    accra: { 
      name: 'Accra', 
      icon: <Building size={16} />,
      riskLevel: 'HIGH',
      description: 'Capital city with severe flooding due to rapid urbanization and blocked drainage.'
    },
    takoradi: { 
      name: 'Takoradi', 
      icon: <Droplets size={16} />,
      riskLevel: 'MODERATE',
      description: 'Coastal city with flood risk from sea-level rise and urban runoff.'
    },
    tarkwa: { 
      name: 'Tarkwa', 
      icon: <Trees size={16} />,
      riskLevel: 'HIGH',
      description: 'Mining area with flood risk from deforestation and land degradation.'
    },
    obuasi: { 
      name: 'Obuasi', 
      icon: <AlertTriangle size={16} />,
      riskLevel: 'CRITICAL',
      description: 'Mining community with severe water contamination and flood risk.'
    }
  };

  // ─── Dynamic Matrix Data for All Regions ──────────────────────────────────
  const getRegionMatrix = (regionKey) => {
    const matrixData = {
      accra: {
        low: {
          short: 'Community flood awareness programs in Accra',
          medium: 'Regular gutter clearing and silt removal in flood-prone areas',
          long: 'Expansion of drainage infrastructure in urban settlements'
        },
        moderate: {
          short: 'Clear drains and distribute sandbags in low-lying areas',
          medium: 'Desilt Odaw River and repair retaining walls',
          long: 'Construct retention ponds at Kwame Nkrumah Circle'
        },
        high: {
          short: 'Activate local shelters and broadcast radio warnings',
          medium: 'Plant bamboo along riverbanks and construct retention dams',
          long: 'Relocate vulnerable communities from flood zones'
        },
        severe: {
          short: 'IMMEDIATE EVACUATION of low-lying areas',
          medium: 'Deploy military rescue and set up field hospitals',
          long: 'Enact flood-resilient building codes for reconstruction'
        }
      },
      takoradi: {
        low: {
          short: 'Coastal community awareness and education campaigns',
          medium: 'Regular maintenance of coastal drainage systems',
          long: 'Strengthen coastal vegetation buffer zones'
        },
        moderate: {
          short: 'Clear drains and install flood monitoring sensors',
          medium: 'Repair sea walls and desilt coastal gutters',
          long: 'Construct additional coastal defense structures'
        },
        high: {
          short: 'Activate emergency shelters and issue coastal warnings',
          medium: 'Construct sea walls in vulnerable areas',
          long: 'Relocate communities from high-risk coastal zones'
        },
        severe: {
          short: 'IMMEDIATE COASTAL EVACUATION',
          medium: 'Deploy marine rescue craft and emergency response teams',
          long: 'Implement long-term coastal protection master plan'
        }
      },
      tarkwa: {
        low: {
          short: 'Mining community awareness and education programs',
          medium: 'Regular monitoring of abandoned mining pits',
          long: 'Restore degraded mining lands and reforest areas'
        },
        moderate: {
          short: 'Clear drainage channels and distribute flood kits',
          medium: 'Reforest mining-degraded areas and create flood diversion channels',
          long: 'Enforce strict mining regulations near water bodies'
        },
        high: {
          short: 'Activate emergency shelters and issue mining-area warnings',
          medium: 'Construct flood diversion channels and restore vegetation',
          long: 'Relocate communities from high-risk mining areas'
        },
        severe: {
          short: 'IMMEDIATE EVACUATION of mining-affected areas',
          medium: 'Deploy mining rescue teams and emergency response',
          long: 'Implement comprehensive mining area rehabilitation plan'
        }
      },
      obuasi: {
        low: {
          short: 'Water safety and community health education',
          medium: 'Regular monitoring of River Nyam water quality',
          long: 'Install water treatment facilities in communities'
        },
        moderate: {
          short: 'Clear drains and distribute water safety kits',
          medium: 'Desilt drainage systems and restore vegetation',
          long: 'Construct water treatment plants and improve drainage'
        },
        high: {
          short: 'Activate emergency shelters and issue water safety warnings',
          medium: 'Address tailings dam safety and restore vegetation',
          long: 'Relocate communities from high-contamination areas'
        },
        severe: {
          short: 'IMMEDIATE EVACUATION of contaminated areas',
          medium: 'Deploy water safety teams and emergency supplies',
          long: 'Implement comprehensive water safety and rehabilitation plan'
        }
      }
    };
    return matrixData[regionKey] || matrixData.accra;
  };

  // ─── Calculate Progress ────────────────────────────────────────────────────
  const calculateProgress = (regionKey) => {
    const list = checklists[regionKey] || [];
    if (list.length === 0) return 0;
    const completed = list.filter(item => item.status === 'Done').length;
    const inProgress = list.filter(item => item.status === 'In Progress').length;
    const score = (completed * 100 + inProgress * 50) / list.length;
    return Math.round(score);
  };

  // ─── Animate Progress on Load ──────────────────────────────────────────────
  useEffect(() => {
    const progress = {};
    Object.keys(checklists).forEach(key => {
      progress[key] = calculateProgress(key);
    });
    
    Object.keys(progress).forEach(key => {
      setTimeout(() => {
        setAnimatedProgress(prev => ({ ...prev, [key]: progress[key] }));
      }, 300);
    });
  }, [checklists]);

  // ─── Get Status Icon ───────────────────────────────────────────────────────
  const getStatusIcon = (status) => {
    if (status === 'Done') return <CheckSquare className="text-emerald-600 shrink-0" size={18} />;
    if (status === 'In Progress') return <Square className="text-amber-500 shrink-0" size={18} />;
    return <Square className="text-slate-300 shrink-0" size={18} />;
  };

  // ─── Get Risk Level Color ──────────────────────────────────────────────────
  const getRiskColor = (region) => {
    const progress = calculateProgress(region);
    if (progress >= 80) return { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Low Risk' };
    if (progress >= 50) return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Moderate Risk' };
    if (progress >= 30) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'High Risk' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical Risk' };
  };

  // ─── Get Region Recommendations ────────────────────────────────────────────
  const getRegionRecommendations = (regionKey) => {
    const recommendations = {
      accra: {
        title: 'Accra Flood Mitigation Plan',
        actions: [
          'Clear Odaw River drainage system immediately',
          'Construct retention ponds at Kwame Nkrumah Circle',
          'Install flood barriers at Adabraka',
          'Implement community early warning system',
          'Plant bamboo along riverbanks',
          'Desilt major drainage channels'
        ],
        authority: 'Accra Metropolitan Assembly'
      },
      takoradi: {
        title: 'Takoradi Coastal Defense Strategy',
        actions: [
          'Improve drainage in lower-lying areas',
          'Construct sea walls where needed',
          'Relocate communities in high-risk zones',
          'Install flood monitoring sensors',
          'Educate residents on flood preparedness',
          'Strengthen coastal vegetation buffer'
        ],
        authority: 'Sekondi-Takoradi Metropolitan Assembly'
      },
      tarkwa: {
        title: 'Tarkwa Mining-Area Flood Control',
        actions: [
          'Restore mining-degraded lands',
          'Reforest areas to absorb water',
          'Regulate mining near water bodies',
          'Create flood diversion channels',
          'Enforce mining regulations strictly',
          'Monitor water levels in abandoned pits'
        ],
        authority: 'Mining Regulatory Authority'
      },
      obuasi: {
        title: 'Obuasi Water Safety & Drainage Plan',
        actions: [
          'Address tailings dam safety urgently',
          'Restore vegetation cover',
          'Improve drainage infrastructure',
          'Enforce mining regulations',
          'Monitor arsenic levels in River Nyam',
          'Install water treatment facilities'
        ],
        authority: 'EPA & Water Resources Commission'
      }
    };
    return recommendations[regionKey] || recommendations.accra;
  };

  const rec = getRegionRecommendations(selectedRegion);
  const riskInfo = getRiskColor(selectedRegion);
  const progress = calculateProgress(selectedRegion);
  const matrix = getRegionMatrix(selectedRegion);

  // ─── Matrix Risk Levels ────────────────────────────────────────────────────
  const matrixLevels = [
    { key: 'low', label: '🟢 LOW', color: 'text-emerald-600' },
    { key: 'moderate', label: '🟡 MODERATE', color: 'text-yellow-600' },
    { key: 'high', label: '🟠 HIGH', color: 'text-orange-600' },
    { key: 'severe', label: '🔴 SEVERE', color: 'text-red-600' }
  ];

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto p-4 md:p-6">
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={28} />
            Regional Flood Prevention
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Tracking physical prevention checklists and infrastructure audits across major risk zones.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
          <Activity size={14} className="text-emerald-600" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </header>

      {/* ─── Progress Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.keys(checklists).map((regionKey) => {
          const prog = calculateProgress(regionKey);
          const isActive = selectedRegion === regionKey;
          const risk = getRiskColor(regionKey);
          const name = regions[regionKey]?.name || regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
          
          return (
            <button
              key={regionKey}
              onClick={() => setSelectedRegion(regionKey)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between shadow-sm transition-all duration-300 ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-700 text-white ring-2 ring-indigo-200 ring-offset-2' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                  <MapPin size={12} />
                  {name}
                </span>
                <ChevronRight size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
              </div>
              
              <div className="mt-3 space-y-2 w-full">
                <div className="flex items-end justify-between">
                  <span className={`text-2xl font-black ${isActive ? 'text-white' : risk.color}`}>
                    {prog}%
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : risk.bg + ' ' + risk.color
                  }`}>
                    {risk.label}
                  </span>
                </div>
                <div className="w-full bg-slate-100/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${isActive ? 'bg-white' : 'bg-indigo-600'}`} 
                    style={{ width: `${animatedProgress[regionKey] || 0}%` }} 
                  />
                </div>
                <div className="text-[10px] opacity-75 font-semibold">Prevention Audit Status</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Detailed Checklist and Recommendations ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" size={20} />
              {regions[selectedRegion]?.name || selectedRegion.toUpperCase()} Drainage & Defense Checklist
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              {progress}% Complete
            </span>
          </div>
          
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span className="text-slate-300 font-bold">Click items to cycle status:</span>
            <span className="text-slate-400">Not Started</span>
            <span className="text-amber-500 font-bold">→ In Progress</span>
            <span className="text-emerald-600 font-bold">→ Done</span>
          </p>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {(checklists[selectedRegion] || []).map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(selectedRegion, item.id)}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group"
              >
                <div className="shrink-0">
                  {getStatusIcon(item.status)}
                </div>
                <span className={`flex-1 text-sm font-medium text-slate-700 transition-all ${
                  item.status === 'Done' ? 'line-through text-slate-400 font-normal' : ''
                }`}>
                  {item.task}
                </span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase transition-all ${
                  item.status === 'Done' ? 'bg-emerald-100 text-emerald-800' :
                  item.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {item.status === 'Done' ? 'Done' :
                   item.status === 'In Progress' ? 'In Progress' : 'Not Started'}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar Summary */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Overall Progress</span>
              <span className="text-slate-800 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${
                  progress >= 80 ? 'bg-emerald-500' :
                  progress >= 50 ? 'bg-amber-500' :
                  progress >= 30 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── Region Specific Recommendations ────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="text-amber-500 animate-pulse" size={18} />
              Mitigation Directives
            </h3>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${riskInfo.bg} ${riskInfo.color}`}>
              {riskInfo.label}
            </span>
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-700 mb-3">{rec.title}</h4>
            <ul className="space-y-2.5">
              {rec.actions.slice(0, 6).map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="text-emerald-500 font-bold text-xs mt-0.5">▸</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex items-center gap-2">
            <span>🏛️</span>
            <span>Authority: {rec.authority}</span>
          </div>
        </div>
      </div>

      {/* ─── DYNAMIC Prevention Strategy Matrix ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" />
            Mitigation Roadmap Matrix
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {regions[selectedRegion]?.name || selectedRegion.toUpperCase()}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Dynamic • Region-Specific</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-700 font-bold border-b">
              <tr>
                <th scope="col" className="px-4 py-3.5">Risk Level</th>
                <th scope="col" className="px-4 py-3.5">Short-term (Immediate)</th>
                <th scope="col" className="px-4 py-3.5">Medium-term (1-6 months)</th>
                <th scope="col" className="px-4 py-3.5">Long-term (6+ months)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {matrixLevels.map((level) => {
                const data = matrix[level.key];
                return (
                  <tr key={level.key} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-4 py-4 font-bold ${level.color}`}>
                      {level.label}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{data?.short || 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-600">{data?.medium || 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-600">{data?.long || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[10px] text-slate-400 text-right border-t border-slate-100 pt-2">
          Recommendations tailored for {regions[selectedRegion]?.name || selectedRegion.toUpperCase()}
        </div>
      </div>

      {/* ─── Status Summary Footer ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-2xl font-black text-emerald-600">
            {checklists[selectedRegion]?.filter(i => i.status === 'Done').length || 0}
          </p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-2xl font-black text-amber-600">
            {checklists[selectedRegion]?.filter(i => i.status === 'In Progress').length || 0}
          </p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">In Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-2xl font-black text-slate-400">
            {checklists[selectedRegion]?.filter(i => i.status === 'Not Started').length || 0}
          </p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Not Started</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-2xl font-black text-indigo-600">{progress}%</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overall</p>
        </div>
      </div>
    </div>
  );
}