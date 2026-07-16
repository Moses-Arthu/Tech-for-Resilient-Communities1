import React from 'react';
import { useApp } from '../context/AppContext';
import { Navigation, Battery, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react';

export default function DroneManagement() {
  const { drones, setDrones } = useApp();

  const handleRecall = (id) => {
    setDrones(prevDrones =>
      prevDrones.map(drone => {
        if (drone.id === id) {
          return {
            ...drone,
            status: 'Recalled to Base',
            coords: drone.base,
            pathIndex: 0
          };
        }
        return drone;
      })
    );
  };

  const handleLaunchPatrol = (id) => {
    setDrones(prevDrones =>
      prevDrones.map(drone => {
        if (drone.id === id) {
          return {
            ...drone,
            status: 'Patrolling Route',
            coords: drone.base,
            pathIndex: 0
          };
        }
        return drone;
      })
    );
  };

  const handleThermalScan = (id) => {
    setDrones(prevDrones =>
      prevDrones.map(drone => {
        if (drone.id === id) {
          return {
            ...drone,
            status: 'Executing Thermal Canopy Scan',
            battery: Math.max(10, drone.battery - 5.0)
          };
        }
        return drone;
      })
    );
  };

  return (
    <div className="space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">UAV Drone Fleet Telemetry</h2>
        <p className="text-slate-500 font-medium">Control autonomous aerial surveillance sweeps and monitor telemetry feeds in real-time.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drones.map(drone => (
          <div key={drone.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                  <Navigation className="rotate-45 text-indigo-500" size={16} />
                  {drone.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Node ID: {drone.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  drone.status.includes('Scan') ? 'bg-amber-100 text-amber-800' :
                  drone.status.includes('Base') ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {drone.status}
                </span>
              </div>
            </div>

            {/* Battery & Telemetry data */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3">
                <Battery size={20} className={drone.battery < 25 ? 'text-red-500 animate-pulse' : 'text-emerald-500'} />
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">UAV Power Grid</span>
                  <span className="font-black text-sm text-slate-800">{drone.battery.toFixed(0)}% Remaining</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3">
                <Activity size={20} className="text-indigo-500" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coordinates</span>
                  <span className="font-black text-xs text-slate-700 font-mono">
                    {drone.coords[0].toFixed(4)}N, {drone.coords[1].toFixed(4)}W
                  </span>
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div className="space-y-1.5 text-xs">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Patrol Bounds</span>
              <div className="p-3 bg-slate-900 rounded font-mono text-[10px] text-slate-400 space-y-1">
                {drone.path.map((point, index) => (
                  <div key={index} className={drone.pathIndex === index ? 'text-emerald-400 font-bold' : ''}>
                    Node {index + 1}: [{point[0].toFixed(4)}, {point[1].toFixed(4)}] {drone.pathIndex === index ? ' (Active target)' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold border-t pt-4">
              <button
                onClick={() => handleRecall(drone.id)}
                className="p-2 border hover:bg-slate-50 text-slate-600 rounded flex items-center justify-center gap-1 transition-all"
              >
                <RefreshCw size={11} /> Recall Base
              </button>
              <button
                onClick={() => handleLaunchPatrol(drone.id)}
                className="p-2 border hover:bg-slate-50 text-slate-600 rounded flex items-center justify-center gap-1 transition-all"
              >
                <Navigation size={11} className="rotate-45" /> Launch Patrol
              </button>
              <button
                onClick={() => handleThermalScan(drone.id)}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center justify-center gap-1 transition-all shadow-sm"
              >
                <Cpu size={11} /> Thermal Scan
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-900 border rounded-xl flex items-start gap-3 text-slate-300 font-semibold text-xs leading-relaxed max-w-xl mx-auto">
        <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <p>
          Drone operations are managed via UNESCO IoT coordination loops. Battery depletion triggers auto-return protocols, shifting the drone's coordinates to its corresponding base location.
        </p>
      </div>
    </div>
  );
}
