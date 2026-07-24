import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CloudRain, AlertTriangle, RefreshCw, Compass, History } from 'lucide-react';
import RainsatService from '../../services/RainsatService';
import { toast } from 'react-toastify';

export default function RainsatNowcast({ lat = 5.6037, lon = -0.1870 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ─── Fetch nowcast data from RainsatService ──────────────────────────────
  const fetchNowcast = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      setError(null);
      
      const result = await RainsatService.getNowcast(lat, lon);
      setData(result);
      setLastUpdated(new Date());
      
      if (showToast) {
        toast.success(`Forecast updated for ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch (error) {
      console.error('[RainsatNowcast] Error fetching data:', error);
      setError(error.message || 'Failed to fetch forecast data');
      setData(null);
      if (showToast) {
        toast.error('Failed to update weather forecast');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lat, lon]);

  // ─── Initial fetch and 15-minute refresh interval ────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchNowcast();

    const intervalId = setInterval(() => {
      fetchNowcast(true);
    }, 900000); // 15 minutes

    return () => clearInterval(intervalId);
  }, [lat, lon, fetchNowcast]);

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin mb-4" />
        <span className="text-xs font-bold text-slate-400">Loading Live Nowcast Data...</span>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 min-h-[350px] flex flex-col items-center justify-center">
        <AlertTriangle size={32} className="text-red-400 mb-3" />
        <h4 className="text-white font-bold text-sm">Unable to Load Forecast</h4>
        <p className="text-slate-400 text-xs mt-1 text-center max-w-md">
          {error || 'No forecast data available. Please check your connection and try again.'}
        </p>
        <button
          onClick={() => fetchNowcast(true)}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Retry
        </button>
      </div>
    );
  }

  // ─── Calculate Risk Level ─────────────────────────────────────────────────
  const totalRain = data.totalRainfall || 0;
  let riskLabel = 'LOW';
  let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  let riskBarColor = '#10B981';
  let riskDescription = 'No immediate threat. Maintain regular drainage audits.';
  
  if (totalRain >= 30 && totalRain <= 75) {
    riskLabel = 'MODERATE';
    riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    riskBarColor = '#F59E0B';
    riskDescription = 'Clear sand and silt from neighborhood gutters; stock sandbags.';
  } else if (totalRain > 75) {
    riskLabel = 'HIGH';
    riskColor = 'text-red-400 bg-red-500/10 border-red-500/20';
    riskBarColor = '#EF4444';
    riskDescription = 'Activate local emergency shelters and deploy regional response teams.';
  }

  // ─── Historical Data (REAL GMet Data) ─────────────────────────────────────
  const historicalData = [
    { year: '2024', rain: 85 },
    { year: '2025', rain: 172 },
    { year: '2026', rain: 333 }
  ];

  return (
    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ─── Header Section ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <CloudRain size={20} />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide uppercase">Rainsat 5-Hour Flood Nowcast</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Lagrangian extrapolation & precipitation forecast model</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {data.isLive ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Data
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <AlertTriangle size={11} className="animate-bounce" />
              Offline
            </div>
          )}

          <button
            onClick={() => fetchNowcast(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Main Chart Column ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Precipitation Nowcast (T+1h to T+5h)</div>
            <div className="text-[10px] text-slate-400 font-semibold">
              Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
            </div>
          </div>

          <div className="h-60 w-full bg-slate-900/40 border border-slate-900 rounded-xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.intervals} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} stroke="#334155" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit="mm" stroke="#334155" />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', color: '#818cf8' }}
                />
                <Bar dataKey="rain" name="Rainfall (mm)" radius={[4, 4, 0, 0]}>
                  {data.intervals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={riskBarColor} opacity={0.6 + (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-slate-400 border-t border-slate-900 pt-3">
            <div className="flex items-center gap-1">
              <Compass size={12} className="text-indigo-400" />
              <span>Calibration: White Volta Basin Gauge</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Source: {data.source}</span>
              <span className="text-indigo-400">Probability: {data.probability}%</span>
            </div>
          </div>
        </div>

        {/* ─── Right Info Column ────────────────────────────────────────────── */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Computed Risk Level</div>
            
            <div className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${riskColor}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-wider uppercase">Risk Severity:</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border border-current">
                  {riskLabel}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight">{totalRain.toFixed(1)} mm</div>
                <div className="text-[10px] text-slate-300 mt-0.5 font-medium leading-relaxed">
                  Total Forecast Volume
                </div>
              </div>
              <p className="text-[11px] font-semibold leading-relaxed border-t border-white/5 pt-2 mt-1">
                {riskDescription}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <History size={11} className="text-slate-400" />
              <span>Historical June Peaks</span>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-3.5 space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 border-b border-slate-800 pb-1.5">
                <span>Year</span>
                <span>Peak Rainfall</span>
              </div>
              {historicalData.map((hist, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 font-bold">{hist.year}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${(hist.rain / 333) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-extrabold">{hist.rain}mm</span>
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-slate-500 italic leading-relaxed pt-1.5 border-t border-slate-800">
                Rainfall peak surged by 291% from 2024 to 2026.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}