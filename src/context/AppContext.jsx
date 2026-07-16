import React, { createContext, useState, useEffect, useContext } from 'react';
import { REAL_DATA } from '../data/realData';
import { reverseGeocode, triggerSMSAlert, triggerPushNotification } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [user, setUser] = useState({
    phone: '+233 24 555 1234',
    role: 'Citizen', // Citizen, Responder, Authority, Admin
    isAuthenticated: true,
    name: 'Kwame Mensah'
  });

  // User list of reports (Pre-populated with real historical/active incidents)
  const [reports, setReports] = useState([
    {
      id: 'rep-1',
      title: 'Active Mining in Huniso',
      type: 'Mining',
      locationName: 'Huniso, near Tarkwa, Western Region',
      detail: REAL_DATA.miningIncidents[0].detail,
      status: 'Verified',
      coords: REAL_DATA.miningIncidents[0].coords,
      photo: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=400&q=80',
      timestamp: '2026-07-16T10:30:00Z',
      reporterPhone: '+233 24 999 0011',
      satelliteChecked: true,
      alertsSent: true
    },
    {
      id: 'rep-2',
      title: 'Explosives Damage Akrokerri SHS',
      type: 'Mining',
      locationName: 'Akrokerri, near Obuasi, Ashanti Region',
      detail: REAL_DATA.miningIncidents[1].detail,
      status: 'In Progress',
      coords: REAL_DATA.miningIncidents[1].coords,
      photo: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
      timestamp: '2026-07-16T12:15:00Z',
      reporterPhone: '+233 20 888 2233',
      satelliteChecked: true,
      alertsSent: true
    },
    {
      id: 'rep-3',
      title: 'River Offin Excavators',
      type: 'Mining',
      locationName: 'Dunkwa-On-Offin, Central Region',
      detail: REAL_DATA.miningIncidents[2].detail,
      status: 'Pending',
      coords: REAL_DATA.miningIncidents[2].coords,
      photo: null,
      timestamp: '2026-07-16T14:40:00Z',
      reporterPhone: '+233 55 777 4455',
      satelliteChecked: false,
      alertsSent: false
    },
    {
      id: 'rep-4',
      title: 'Odaw River Blockage',
      type: 'Flood',
      locationName: 'Odaw River Basin, Accra',
      detail: 'Massive plastic accumulation clogging natural drainage channels below Kwame Nkrumah Circle.',
      status: 'Verified',
      coords: REAL_DATA.locations.odawRiver,
      photo: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=400&q=80',
      timestamp: '2026-07-16T08:00:00Z',
      reporterPhone: '+233 24 555 1234',
      satelliteChecked: true,
      alertsSent: true
    }
  ]);

  // Global Emergency Alert Status (SOS)
  const [sosAlert, setSosAlert] = useState(false);

  // Region Prevention Checklists
  const [checklists, setChecklists] = useState(REAL_DATA.regionChecklists);

  // GPS IoT Sensors State (Normal, Rising, Warning, Critical)
  const [sensors, setSensors] = useState([
    { id: 'sens-1', name: 'Odaw River Gauge A', coords: [5.55, -0.20], value: '1.2m', status: 'Critical', region: 'Accra' },
    { id: 'sens-2', name: 'Circle Drainage Sensor B', coords: [5.55, -0.21], value: '0.8m', status: 'Warning', region: 'Accra' },
    { id: 'sens-3', name: 'Takoradi Port Road Sensor', coords: [4.8916, -1.7748], value: '0.3m', status: 'Normal', region: 'Takoradi' },
    { id: 'sens-4', name: 'Tarkwa Offin Sensor', coords: [5.3063, -1.9839], value: '0.5m', status: 'Rising', region: 'Tarkwa' }
  ]);

  // Active Surveillance Drones (Updating positions in realtime)
  const [drones, setDrones] = useState([
    {
      id: 'drone-1',
      name: 'Sentinel Alpha (Tarkwa Drone)',
      coords: [5.3063, -1.9839],
      battery: 88,
      status: 'Patrolling',
      base: [5.3063, -1.9839],
      path: [
        [5.3063, -1.9839],
        [5.28, -1.98], // Huniso
        [5.41, -2.02], // Wassa Gyapa
        [5.44, -2.04], // Wassa Dadieso
        [5.3063, -1.9839]
      ],
      pathIndex: 0
    },
    {
      id: 'drone-2',
      name: 'FloodWatch Beta (Accra Circle)',
      coords: [5.55, -0.21],
      battery: 94,
      status: 'Active Surveillance',
      base: [5.55, -0.21],
      path: [
        [5.55, -0.21], // Kwame Nkrumah Circle
        [5.55, -0.20], // Odaw River
        [5.55, -0.22], // Adabraka
        [5.55, -0.21]
      ],
      pathIndex: 0
    }
  ]);

  // API Health Indicator status
  const [apiConnections, setApiConnections] = useState({
    gmet: 'Connected',
    rainsat: 'Connected',
    gdacs: 'Connected',
    gnhr: 'Connected',
    unesco: 'Connected',
    firebase: 'Connected',
    twilio: 'Connected',
    gee: 'Connected'
  });

  // Dual alert trigger notification logger
  const [alertLogs, setAlertLogs] = useState([
    { id: 'log-1', timestamp: '2026-07-16T10:31:00Z', type: 'SMS', recipient: '+233 24 000 1111 (Responder)', message: 'EMERGENCY: Confirmed Illegal Mining at Huniso [5.2800, -1.9800]. Response required.' },
    { id: 'log-2', timestamp: '2026-07-16T10:31:05Z', type: 'Push', recipient: 'Authority Dashboard', message: 'CRITICAL ALERT: Satellite verification confirmed vegetation disturbance at Huniso. Dispatch unit.' },
    { id: 'log-3', timestamp: '2026-07-16T12:16:00Z', type: 'SMS', recipient: '+233 20 111 2222 (Responder)', message: 'EMERGENCY: Explosives and heavy machinery reported near Asare Bediako SHS, Akrokerri.' }
  ]);

  // Handle ticking the drone coords to show movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDrones(prevDrones =>
        prevDrones.map(drone => {
          let nextIndex = (drone.pathIndex + 1) % drone.path.length;
          // Slowly interpolate or jump to the next coordinate on path
          let targetCoords = drone.path[nextIndex];
          let currentCoords = drone.coords;
          
          // Interpolate coordinates slightly for smoother movement
          let latDiff = targetCoords[0] - currentCoords[0];
          let lonDiff = targetCoords[1] - currentCoords[1];
          let dist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
          
          let nextCoords;
          let reached = dist < 0.005;
          if (reached) {
            nextCoords = targetCoords;
          } else {
            nextCoords = [
              currentCoords[0] + latDiff * 0.15,
              currentCoords[1] + lonDiff * 0.15
            ];
          }

          return {
            ...drone,
            coords: nextCoords,
            battery: Math.max(10, drone.battery - 0.25),
            pathIndex: reached ? nextIndex : drone.pathIndex
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Login handler
  const login = (phone, role) => {
    setUser({
      phone,
      role,
      isAuthenticated: true,
      name: role === 'Citizen' ? 'Kwame Mensah' : role === 'Responder' ? 'Officer Addo' : role === 'Authority' ? 'Director Baah' : 'System Admin'
    });
  };

  // Logout handler
  const logout = () => {
    setUser({ phone: '', role: 'Citizen', isAuthenticated: false, name: '' });
  };

  // Add a new citizen report
  const addReport = async (reportData) => {
    const newId = `rep-${Date.now()}`;
    const newReport = {
      id: newId,
      title: reportData.title || `Incident Report #${reports.length + 1}`,
      type: reportData.type,
      locationName: 'Geolocating...',
      detail: reportData.description,
      status: 'Pending',
      coords: reportData.coords || [5.6037, -0.1870],
      photo: reportData.photo || null,
      audio: reportData.audio || null,
      timestamp: new Date().toISOString(),
      reporterPhone: user.phone || '+233 24 555 1234',
      satelliteChecked: false,
      alertsSent: false
    };

    setReports(prev => [newReport, ...prev]);

    // Reverse geocode address async
    const address = await reverseGeocode(newReport.coords[0], newReport.coords[1]);
    setReports(prev =>
      prev.map(r => (r.id === newId ? { ...r, locationName: address } : r))
    );

    // Simulate Satellite Verification and Dual-Alert triggering
    setTimeout(async () => {
      // 1. Mark as verified by satellite simulation
      setReports(prev =>
        prev.map(r => {
          if (r.id === newId) {
            // Send dual alerts if type matches risk criteria
            const msg = `EMERGENCY ALERT: Confirmed ${newReport.type} incident reported at ${address}. Coordinates: [${newReport.coords[0].toFixed(4)}, ${newReport.coords[1].toFixed(4)}]`;
            
            // Trigger API functions
            triggerSMSAlert('+233 24 900 8000', msg);
            triggerPushNotification('Authority', `New Verified ${newReport.type}`, msg);

            // Log the alert transactions
            setAlertLogs(prevLogs => [
              {
                id: `log-${Date.now()}-1`,
                timestamp: new Date().toISOString(),
                type: 'SMS',
                recipient: '+233 24 900 8000 (Local Responder)',
                message: msg
              },
              {
                id: `log-${Date.now()}-2`,
                timestamp: new Date().toISOString(),
                type: 'Push',
                recipient: 'Authority Dashboard',
                message: `[FCM Verified Alert] ${msg}`
              },
              ...prevLogs
            ]);

            return { ...r, status: 'Verified', satelliteChecked: true, alertsSent: true };
          }
          return r;
        })
      );
    }, 3000);

    return newId;
  };

  // Update report status (Authorized Roles only)
  const updateReportStatus = (id, newStatus) => {
    setReports(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  // Toggle Prevention checklist progress
  const toggleChecklistItem = (region, itemId) => {
    setChecklists(prev => {
      const updatedList = prev[region].map(item => {
        if (item.id === itemId) {
          const nextStatus = item.status === 'Done' ? 'Not Started' : item.status === 'In Progress' ? 'Done' : 'In Progress';
          return { ...item, status: nextStatus };
        }
        return item;
      });
      return { ...prev, [region]: updatedList };
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        reports,
        drones,
        sensors,
        sosAlert,
        checklists,
        apiConnections,
        alertLogs,
        login,
        logout,
        addReport,
        updateReportStatus,
        toggleChecklistItem,
        setSosAlert,
        setSensors,
        setDrones
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
