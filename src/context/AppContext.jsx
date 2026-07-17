import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { REAL_DATA } from '../data/realData';
import { reverseGeocode, triggerSMSAlert, triggerPushNotification } from '../services/api';
import { toast } from 'react-toastify';

const AppContext = createContext();

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// Web Audio API sound generator for alarms
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'beep') {
      // Friendly proximity alarm beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'siren') {
      // Repeating dual-tone emergency siren
      let time = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        
        // Alternate frequencies
        const freq = i % 2 === 0 ? 660 : 440;
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
        
        osc.start(time);
        osc.stop(time + 0.5);
        time += 0.55;
      }
    }
  } catch (e) {
    console.error("Web Audio API not supported or blocked by browser policy", e);
  }
};

export const AppProvider = ({ children }) => {
  // Pre-populate registered users in localStorage if empty
  useEffect(() => {
    const existingUsers = localStorage.getItem('resilient_registered_users');
    if (!existingUsers) {
      const defaultUsers = [
        { phone: '+233 24 555 1234', name: 'Kwame Mensah', role: 'Citizen' },
        { phone: '+233 20 888 2233', name: 'Officer Addo', role: 'Responder' },
        { phone: '+233 24 900 8000', name: 'Director Baah', role: 'Authority' },
        { phone: '+233 55 777 4455', name: 'System Admin', role: 'Admin' }
      ];
      localStorage.setItem('resilient_registered_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // Authentication State (checking localStorage session persistence)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('resilient_logged_in_user');
    return savedUser ? JSON.parse(savedUser) : {
      phone: '',
      role: 'Citizen',
      isAuthenticated: false,
      name: ''
    };
  });

  // Current user GPS coordinates (defaulting to Accra Center, but changes on map click)
  const [userCoords, setUserCoords] = useState([5.6037, -0.1870]);

  // Network Peers presence mapping
  const [peers, setPeers] = useState({});

  // Global Emergency Alert Status (SOS)
  const [sosAlert, setSosAlert] = useState(false);
  const [sosSender, setSosSender] = useState(null);

  // Active Surveillance Drones (updating positions in realtime)
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

  // Water level sensors
  const [sensors, setSensors] = useState([
    { id: 'sens-1', name: 'Odaw River Gauge A', coords: [5.55, -0.20], value: '1.2m', status: 'Critical', region: 'Accra' },
    { id: 'sens-2', name: 'Circle Drainage Sensor B', coords: [5.55, -0.21], value: '0.8m', status: 'Warning', region: 'Accra' },
    { id: 'sens-3', name: 'Takoradi Port Road Sensor', coords: [4.8916, -1.7748], value: '0.3m', status: 'Normal', region: 'Takoradi' },
    { id: 'sens-4', name: 'Tarkwa Offin Sensor', coords: [5.3063, -1.9839], value: '0.5m', status: 'Rising', region: 'Tarkwa' }
  ]);

  // API connections status
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

  // Load/Save Reports dynamically from shared LocalStorage database
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('resilient_reports');
    if (saved) return JSON.parse(saved);
    
    // Default starting list
    const defaults = [
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
    ];
    localStorage.setItem('resilient_reports', JSON.stringify(defaults));
    return defaults;
  });

  // Load/Save Alert dispatch logs from shared LocalStorage database
  const [alertLogs, setAlertLogs] = useState(() => {
    const saved = localStorage.getItem('resilient_alert_logs');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 'log-1', timestamp: '2026-07-16T10:31:00Z', type: 'SMS', recipient: '+233 24 000 1111 (Responder)', message: 'EMERGENCY: Confirmed Illegal Mining at Huniso [5.2800, -1.9800]. Response required.' },
      { id: 'log-2', timestamp: '2026-07-16T10:31:05Z', type: 'Push', recipient: 'Authority Dashboard', message: 'CRITICAL ALERT: Satellite verification confirmed vegetation disturbance at Huniso. Dispatch unit.' }
    ];
    localStorage.setItem('resilient_alert_logs', JSON.stringify(defaults));
    return defaults;
  });

  const [checklists, setChecklists] = useState(REAL_DATA.regionChecklists);

  // BroadcastChannel for cross-tab messaging
  const channelRef = useRef(null);
  // Keep track of which peers we have already beeped for to avoid spamming beeps
  const alarmedPeersRef = useRef(new Set());

  // Setup BroadcastChannel and listeners
  useEffect(() => {
    const channel = new BroadcastChannel('resilient_ghana_channel');
    channelRef.current = channel;

    const handleMessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'PEER_HEARTBEAT':
          if (payload.phone !== user.phone) {
            setPeers(prev => ({
              ...prev,
              [payload.phone]: {
                name: payload.name,
                role: payload.role,
                coords: payload.coords,
                sosActive: payload.sosActive,
                lastSeen: Date.now()
              }
            }));

            // Sync SOS status if peer has active SOS
            if (payload.sosActive) {
              setSosAlert(true);
            }
          }
          break;

        case 'PEER_LOGOUT':
          setPeers(prev => {
            const next = { ...prev };
            delete next[payload.phone];
            return next;
          });
          break;

        case 'NEW_REPORT':
          setReports(prev => {
            if (prev.some(r => r.id === payload.id)) return prev;
            const updated = [payload, ...prev];
            localStorage.setItem('resilient_reports', JSON.stringify(updated));
            return updated;
          });
          break;

        case 'REPORT_STATUS_UPDATE':
          setReports(prev => {
            const updated = prev.map(r => r.id === payload.id ? { ...r, status: payload.status } : r);
            localStorage.setItem('resilient_reports', JSON.stringify(updated));
            return updated;
          });
          break;

        case 'SOS_ALERT':
          setSosAlert(true);
          setSosSender(payload);
          playSound('siren');
          toast.error(`⚠️ CRITICAL SOS DISPATCH BROADCASTED BY ${payload.name.toUpperCase()}!`);
          
          // Redirect drones to SOS target
          setDrones(prevDrones =>
            prevDrones.map(drone => ({
              ...drone,
              status: 'DEPLOYING TO SOS HAZARD AREA',
              coords: payload.coords
            }))
          );
          break;

        case 'SOS_RESET':
          setSosAlert(false);
          setSosSender(null);
          toast.info("SOS broadcast clear. Standing down.");
          break;

        case 'NEW_ALERT_LOG':
          setAlertLogs(prev => {
            if (prev.some(l => l.id === payload.id)) return prev;
            const updated = [payload, ...prev];
            localStorage.setItem('resilient_alert_logs', JSON.stringify(updated));
            return updated;
          });
          break;

        case 'PEER_FEEDBACK':
          if (payload.recipientPhone === user.phone) {
            playSound('beep');
            toast.info(`💬 Feedback from ${payload.senderName}: "${payload.text}"`, {
              autoClose: 8000,
              icon: "💬"
            });
            
            const feedbackLog = {
              id: `feedback-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'Push',
              recipient: 'You',
              message: `[Direct Feedback] ${payload.senderName}: "${payload.text}"`
            };

            setAlertLogs(prev => {
              const updated = [feedbackLog, ...prev];
              localStorage.setItem('resilient_alert_logs', JSON.stringify(updated));
              return updated;
            });
          }
          break;

        default:
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    // Initial listener to load localStorage changes when other tabs edit them
    const handleStorageChange = (e) => {
      if (e.key === 'resilient_reports') {
        setReports(JSON.parse(e.newValue || '[]'));
      }
      if (e.key === 'resilient_alert_logs') {
        setAlertLogs(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user.phone]);

  // Periodic Heartbeat Broadcaster & Dead peer purger
  useEffect(() => {
    if (!user.isAuthenticated) return;

    // Send initial heartbeat
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'PEER_HEARTBEAT',
        payload: {
          phone: user.phone,
          name: user.name,
          role: user.role,
          coords: userCoords,
          sosActive: sosAlert
        }
      });
    }

    // Heartbeat interval
    const heartbeatInterval = setInterval(() => {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'PEER_HEARTBEAT',
          payload: {
            phone: user.phone,
            name: user.name,
            role: user.role,
            coords: userCoords,
            sosActive: sosAlert
          }
        });
      }
    }, 3000);

    // Dead peers pruning interval (prune if no heartbeat in 9 seconds)
    const pruningInterval = setInterval(() => {
      setPeers(prev => {
        const next = { ...prev };
        let changed = false;
        const now = Date.now();
        Object.keys(next).forEach(phone => {
          if (now - next[phone].lastSeen > 9000) {
            delete next[phone];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 4000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pruningInterval);
    };
  }, [user, userCoords, sosAlert]);

  // Proximity alarm calculator hook
  useEffect(() => {
    if (!user.isAuthenticated) return;

    // Calculate proximity alert thresholds
    Object.keys(peers).forEach(phone => {
      const peer = peers[phone];
      const distance = calculateDistance(userCoords[0], userCoords[1], peer.coords[0], peer.coords[1]);

      if (distance <= 5.0) {
        // If peer is within 5km and we haven't alarmed for them yet
        if (!alarmedPeersRef.current.has(phone)) {
          alarmedPeersRef.current.add(phone);
          
          // Trigger alarm beep sound
          playSound('beep');

          // Trigger toast
          toast.warning(`⚠️ Nearby User Alert: ${peer.name} (${peer.role}) is ${distance.toFixed(1)}km away!`);

          // Log the alert to local dispatch logs
          const logPayload = {
            id: `proximity-alert-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'SMS',
            recipient: `${user.name} (${user.role})`,
            message: `PROXIMITY WARNING: Connected node ${peer.name} (${peer.role}) detected at distance ${distance.toFixed(2)}km.`
          };

          setAlertLogs(prev => {
            const updated = [logPayload, ...prev];
            localStorage.setItem('resilient_alert_logs', JSON.stringify(updated));
            return updated;
          });

          if (channelRef.current) {
            channelRef.current.postMessage({
              type: 'NEW_ALERT_LOG',
              payload: logPayload
            });
          }
        }
      } else {
        // Peer has moved outside the 5km range, reset alarm trigger
        if (alarmedPeersRef.current.has(phone)) {
          alarmedPeersRef.current.delete(phone);
        }
      }
    });
  }, [peers, userCoords, user]);

  // Login handler
  const login = (phone, role, name) => {
    const loggedInUser = {
      phone,
      role,
      isAuthenticated: true,
      name
    };
    setUser(loggedInUser);
    localStorage.setItem('resilient_logged_in_user', JSON.stringify(loggedInUser));

    // Force geolocation lookups or default to center Accra coords
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.warn("Using default Ghana coordinates due to location lock denial.", err);
      }
    );
  };

  // Logout handler
  const logout = () => {
    // Notify peers that this tab is departing
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'PEER_LOGOUT',
        payload: { phone: user.phone }
      });
    }

    setUser({ phone: '', role: 'Citizen', isAuthenticated: false, name: '' });
    localStorage.removeItem('resilient_logged_in_user');
    alarmedPeersRef.current.clear();
    setPeers({});
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
      coords: reportData.coords || userCoords,
      photo: reportData.photo || null,
      audio: reportData.audio || null,
      timestamp: new Date().toISOString(),
      reporterPhone: user.phone || '+233 24 555 1234',
      satelliteChecked: false,
      alertsSent: false
    };

    // Update local state and localStorage
    setReports(prev => {
      const updated = [newReport, ...prev];
      localStorage.setItem('resilient_reports', JSON.stringify(updated));
      return updated;
    });

    // Broadcast new report to other tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'NEW_REPORT',
        payload: newReport
      });
    }

    // Geocode coordinates async
    const address = await reverseGeocode(newReport.coords[0], newReport.coords[1]);
    
    // Update local state with address details
    setReports(prev => {
      const updated = prev.map(r => (r.id === newId ? { ...r, locationName: address } : r));
      localStorage.setItem('resilient_reports', JSON.stringify(updated));
      return updated;
    });

    // Simulate Satellite Verification
    setTimeout(async () => {
      setReports(prev => {
        const updated = prev.map(r => {
          if (r.id === newId) {
            const msg = `EMERGENCY ALERT: Confirmed ${newReport.type} incident reported at ${address}. Coordinates: [${newReport.coords[0].toFixed(4)}, ${newReport.coords[1].toFixed(4)}]`;
            
            // Trigger API functions
            triggerSMSAlert('+233 24 900 8000', msg);
            triggerPushNotification('Authority', `New Verified ${newReport.type}`, msg);

            const logPayloadSMS = {
              id: `log-${Date.now()}-1`,
              timestamp: new Date().toISOString(),
              type: 'SMS',
              recipient: '+233 24 900 8000 (Local Responder)',
              message: msg
            };

            const logPayloadPush = {
              id: `log-${Date.now()}-2`,
              timestamp: new Date().toISOString(),
              type: 'Push',
              recipient: 'Authority Dashboard',
              message: `[FCM Verified Alert] ${msg}`
            };

            setAlertLogs(prevLogs => {
              const updatedLogs = [logPayloadSMS, logPayloadPush, ...prevLogs];
              localStorage.setItem('resilient_alert_logs', JSON.stringify(updatedLogs));
              return updatedLogs;
            });

            if (channelRef.current) {
              channelRef.current.postMessage({
                type: 'NEW_ALERT_LOG',
                payload: logPayloadSMS
              });
              channelRef.current.postMessage({
                type: 'NEW_ALERT_LOG',
                payload: logPayloadPush
              });
            }

            return { ...r, status: 'Verified', satelliteChecked: true, alertsSent: true };
          }
          return r;
        });

        localStorage.setItem('resilient_reports', JSON.stringify(updated));
        return updated;
      });
    }, 3000);

    return newId;
  };

  // Update report status (Authorized Roles only)
  const updateReportStatus = (id, newStatus) => {
    setReports(prev => {
      const updated = prev.map(r => (r.id === id ? { ...r, status: newStatus } : r));
      localStorage.setItem('resilient_reports', JSON.stringify(updated));
      return updated;
    });

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'REPORT_STATUS_UPDATE',
        payload: { id, status: newStatus }
      });
    }
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

  // Custom trigger for SOS alert that broadcasts to other tabs
  const broadcastSOS = (active) => {
    setSosAlert(active);
    if (active) {
      setSosSender({
        name: user.name,
        phone: user.phone,
        coords: userCoords
      });
    } else {
      setSosSender(null);
    }
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: active ? 'SOS_ALERT' : 'SOS_RESET',
        payload: {
          name: user.name,
          phone: user.phone,
          coords: userCoords
        }
      });
    }
  };

  // Send quick feedback to a peer user
  const sendFeedback = (recipientPhone, text) => {
    if (!channelRef.current) return;
    channelRef.current.postMessage({
      type: 'PEER_FEEDBACK',
      payload: {
        senderPhone: user.phone,
        senderName: user.name,
        recipientPhone,
        text,
        timestamp: new Date().toISOString()
      }
    });
    toast.success("Feedback sent!");
  };

  // Tick the drone coordinates to show movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDrones(prevDrones =>
        prevDrones.map(drone => {
          let nextIndex = (drone.pathIndex + 1) % drone.path.length;
          let targetCoords = drone.path[nextIndex];
          let currentCoords = drone.coords;
          
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

  return (
    <AppContext.Provider
      value={{
        user,
        userCoords,
        setUserCoords,
        peers,
        reports,
        drones,
        sensors,
        sosAlert,
        sosSender,
        checklists,
        apiConnections,
        alertLogs,
        login,
        logout,
        addReport,
        updateReportStatus,
        toggleChecklistItem,
        broadcastSOS,
        sendFeedback,
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
