import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { REAL_DATA } from '../data/realData';
import { reverseGeocode, triggerSMSAlert, triggerPushNotification } from '../services/api';
import { toast } from 'react-toastify';
import { SOSService } from '../services/SOSService';
import { wsService } from '../services/WebSocketService';

const AppContext = createContext();

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Web Audio API sound generator for alarms
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'siren') {
      let time = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        const freq = i % 2 === 0 ? 880 : 550;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.18, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
        osc.start(time);
        osc.stop(time + 0.5);
        time += 0.55;
      }
    }
  } catch (e) {
    console.error('Web Audio API not supported or blocked by browser policy', e);
  }
};

// ─── Browser Push Notification helpers ──────────────────────────────────────
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
};

const sendBrowserNotification = (title, body, icon = '🚨') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      badge: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      tag: 'sos-alert',
      requireInteraction: true,   // keeps the notification visible until dismissed
      vibrate: [300, 100, 300, 100, 300]
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (e) {
    console.error('Could not show browser notification:', e);
  }
};

// ────────────────────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  // Clear prepopulated dummy users and ensure empty registered list if none exists
  useEffect(() => {
    const existingUsers = localStorage.getItem('resilient_registered_users');
    if (!existingUsers) {
      localStorage.setItem('resilient_registered_users', JSON.stringify([]));
    }
  }, []);

  // Authentication State
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('resilient_logged_in_user');
    return savedUser ? JSON.parse(savedUser) : {
      phone: '',
      role: 'Citizen',
      isAuthenticated: false,
      name: ''
    };
  });

  // Current user GPS coordinates
  const [userCoords, setUserCoords] = useState([5.6037, -0.1870]);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);

  // Network Peers presence mapping
  const [peers, setPeers] = useState({});

  // Global Emergency Alert Status (SOS)
  const [sosAlert, setSosAlert] = useState(false);
  const [sosSender, setSosSender] = useState(null);

  // SOS Feedback wall — messages from helpers responding to an active SOS
  const [sosFeedbacks, setSosFeedbacks] = useState([]);

  // Active Surveillance Drones
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
        [5.28, -1.98],
        [5.41, -2.02],
        [5.44, -2.04],
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
        [5.55, -0.21],
        [5.55, -0.20],
        [5.55, -0.22],
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

  // Reports
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('resilient_reports');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('resilient_reports', JSON.stringify([]));
    return [];
  });

  // Alert logs
  const [alertLogs, setAlertLogs] = useState(() => {
    const saved = localStorage.getItem('resilient_alert_logs');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('resilient_alert_logs', JSON.stringify([]));
    return [];
  });

  const [checklists, setChecklists] = useState(REAL_DATA.regionChecklists);

  // BroadcastChannel ref
  const channelRef = useRef(null);
  const alarmedPeersRef = useRef(new Set());

  // ─── Request notification permission on mount ──────────────────────────
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // ─── BroadcastChannel setup ────────────────────────────────────────────
  useEffect(() => {
    const channel = new BroadcastChannel('resilient_ghana_channel');
    channelRef.current = channel;

    const handleMessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'PEER_HEARTBEAT': {
          const registeredPeers = JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
          const isPeerRegistered = registeredPeers.some(u => u.phone === payload.phone);
          if (isPeerRegistered && payload.phone !== user.phone) {
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
            if (payload.sosActive) setSosAlert(true);
          }
          break;
        }

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

        case 'SOS_ALERT': {
          const registeredUsersSOS = JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
          const isSosSenderRegistered = registeredUsersSOS.some(u => u.phone === payload.phone);
          if (isSosSenderRegistered) {
            setSosAlert(true);
            setSosSender(payload);
            setSosFeedbacks([]); // reset feedbacks on new SOS
            playSound('siren');

            // Browser Push Notification to all open tabs/windows
            sendBrowserNotification(
              `🚨 SOS ALERT — ${payload.name}`,
              `Emergency broadcast from ${payload.name} at coordinates [${payload.coords[0].toFixed(4)}, ${payload.coords[1].toFixed(4)}]. Immediate assistance required!`
            );

            toast.error(`🚨 CRITICAL SOS: ${payload.name.toUpperCase()} NEEDS IMMEDIATE HELP!`, {
              autoClose: false,
              closeButton: true
            });

            setDrones(prevDrones =>
              prevDrones.map(drone => ({
                ...drone,
                status: 'DEPLOYING TO SOS HAZARD AREA',
                coords: payload.coords
              }))
            );
          }
          break;
        }

        case 'SOS_RESET':
          setSosAlert(false);
          setSosSender(null);
          setSosFeedbacks([]);
          toast.info('✅ SOS broadcast cleared. All units standing down.');
          break;

        case 'SOS_FEEDBACK': {
          // Any registered user's feedback on SOS — show to everyone
          const registeredFb = JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
          const isFbRegistered = registeredFb.some(u => u.phone === payload.senderPhone);
          if (isFbRegistered) {
            setSosFeedbacks(prev => {
              if (prev.some(f => f.id === payload.id)) return prev;
              return [payload, ...prev];
            });
            playSound('beep');
            toast.info(`💬 Help response from ${payload.senderName}: "${payload.text}"`, { autoClose: 6000 });
          }
          break;
        }

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
            const registeredUsersFb = JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
            const isFbSenderRegistered = registeredUsersFb.some(u => u.phone === payload.senderPhone);
            if (isFbSenderRegistered) {
              playSound('beep');
              toast.info(`💬 Feedback from ${payload.senderName}: "${payload.text}"`, {
                autoClose: 8000,
                icon: '💬'
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
          }
          break;

        default:
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    const handleStorageChange = (e) => {
      if (e.key === 'resilient_reports') setReports(JSON.parse(e.newValue || '[]'));
      if (e.key === 'resilient_alert_logs') setAlertLogs(JSON.parse(e.newValue || '[]'));
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user.phone]);

  // ─── Periodic Heartbeat Broadcaster ──────────────────────────────────────
  // Only broadcasts REAL GPS coordinates (waits until gpsReady === true)
  useEffect(() => {
    if (!user.isAuthenticated) return;

    // Helper: write this user's presence into shared localStorage registry
    const publishPresence = (coords) => {
      const presenceStore = JSON.parse(localStorage.getItem('resilient_peer_presence') || '{}');
      presenceStore[user.phone] = {
        name: user.name,
        role: user.role,
        coords,
        sosActive: sosAlert,
        lastSeen: Date.now()
      };
      localStorage.setItem('resilient_peer_presence', JSON.stringify(presenceStore));
    };

    // Helper: read all OTHER users from presence store into state
    const readPresence = () => {
      const registeredPeers = JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
      const presenceStore = JSON.parse(localStorage.getItem('resilient_peer_presence') || '{}');
      const now = Date.now();
      const freshPeers = {};
      Object.keys(presenceStore).forEach(phone => {
        if (phone === user.phone) return; // skip self
        const entry = presenceStore[phone];
        if (now - entry.lastSeen > 12000) return; // stale — skip
        const isRegistered = registeredPeers.some(u => u.phone === phone);
        if (!isRegistered) return;
        freshPeers[phone] = { ...entry, lastSeen: entry.lastSeen };
      });
      setPeers(freshPeers);
    };

    // Only publish/broadcast once we have real GPS coordinates
    if (gpsReady) {
      publishPresence(userCoords);
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'PEER_HEARTBEAT',
          payload: { phone: user.phone, name: user.name, role: user.role, coords: userCoords, sosActive: sosAlert }
        });
      }
    }

    // Read peers from localStorage immediately (includes users who joined earlier)
    readPresence();

    const heartbeatInterval = setInterval(() => {
      if (gpsReady) {
        publishPresence(userCoords);
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'PEER_HEARTBEAT',
            payload: { phone: user.phone, name: user.name, role: user.role, coords: userCoords, sosActive: sosAlert }
          });
        }
      }
      // Always read peers regardless of GPS state
      readPresence();
    }, 3000);

    return () => {
      clearInterval(heartbeatInterval);
      // Remove self from presence store on cleanup
      try {
        const presenceStore = JSON.parse(localStorage.getItem('resilient_peer_presence') || '{}');
        delete presenceStore[user.phone];
        localStorage.setItem('resilient_peer_presence', JSON.stringify(presenceStore));
      } catch (e) { /* ignore */ }
    };
  }, [user, userCoords, sosAlert, gpsReady]);

  // ─── Proximity alarm ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user.isAuthenticated) return;
    Object.keys(peers).forEach(phone => {
      const peer = peers[phone];
      const distance = calculateDistance(userCoords[0], userCoords[1], peer.coords[0], peer.coords[1]);
      if (distance <= 5.0) {
        if (!alarmedPeersRef.current.has(phone)) {
          alarmedPeersRef.current.add(phone);
          playSound('beep');
          toast.warning(`⚠️ Nearby User Alert: ${peer.name} (${peer.role}) is ${distance.toFixed(1)}km away!`);
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
            channelRef.current.postMessage({ type: 'NEW_ALERT_LOG', payload: logPayload });
          }
        }
      } else {
        if (alarmedPeersRef.current.has(phone)) alarmedPeersRef.current.delete(phone);
      }
    });
  }, [peers, userCoords, user]);

  // ─── Continuous real-time GPS tracking ───────────────────────────────────
  useEffect(() => {
    if (!user.isAuthenticated) return;

    let watchId = null;
    if (navigator.geolocation) {
      // Get initial position with high accuracy
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setGpsReady(true);
          // Immediately announce real location to peer registry
          const presenceStore = JSON.parse(localStorage.getItem('resilient_peer_presence') || '{}');
          presenceStore[user.phone] = {
            name: user.name,
            role: user.role,
            coords,
            sosActive: false,
            lastSeen: Date.now()
          };
          localStorage.setItem('resilient_peer_presence', JSON.stringify(presenceStore));
        },
        (err) => {
          console.warn('Unable to fetch initial GPS location:', err);
          setGpsReady(false);
          toast.warning(
            '📍 GPS location access is needed. Please allow location in your browser settings.',
            { toastId: 'geo-warning', autoClose: 8000 }
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      // Continuously watch position for real-time updates
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setGpsReady(true);
        },
        (err) => {
          console.error('Error watching geolocation:', err);
          // Don't reset gpsReady to false on watch errors — we keep last known position
          toast.error('⚠️ GPS signal lost. Using last known location.', {
            toastId: 'geo-error',
            autoClose: 5000
          });
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
      );
    } else {
      toast.error('⚠️ Geolocation is not supported by this browser. SOS location will be approximate.');
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [user.isAuthenticated, user.phone, user.name, user.role]);

  // ─── Login handler ─────────────────────────────────────────────────────────
  const login = (phone, role, name) => {
    const loggedInUser = { phone, role, isAuthenticated: true, name };
    setUser(loggedInUser);
    localStorage.setItem('resilient_logged_in_user', JSON.stringify(loggedInUser));
    // Re-request push notification permission on login
    requestNotificationPermission();
  };

  // ─── Logout handler ────────────────────────────────────────────────────────
  const logout = () => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'PEER_LOGOUT', payload: { phone: user.phone } });
    }
    // Remove from shared peer presence registry
    try {
      const presenceStore = JSON.parse(localStorage.getItem('resilient_peer_presence') || '{}');
      delete presenceStore[user.phone];
      localStorage.setItem('resilient_peer_presence', JSON.stringify(presenceStore));
    } catch (e) { /* ignore */ }

    setUser({ phone: '', role: 'Citizen', isAuthenticated: false, name: '' });
    localStorage.removeItem('resilient_logged_in_user');
    alarmedPeersRef.current.clear();
    setPeers({});
    setSosAlert(false);
    setSosSender(null);
  };

  // ─── Add report ────────────────────────────────────────────────────────────
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

    setReports(prev => {
      const updated = [newReport, ...prev];
      localStorage.setItem('resilient_reports', JSON.stringify(updated));
      return updated;
    });

    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'NEW_REPORT', payload: newReport });
    }

    const address = await reverseGeocode(newReport.coords[0], newReport.coords[1]);
    setReports(prev => {
      const updated = prev.map(r => r.id === newId ? { ...r, locationName: address } : r);
      localStorage.setItem('resilient_reports', JSON.stringify(updated));
      return updated;
    });

    setTimeout(async () => {
      setReports(prev => {
        const updated = prev.map(r => {
          if (r.id === newId) {
            const msg = `EMERGENCY ALERT: Confirmed ${newReport.type} incident reported at ${address}. Coordinates: [${newReport.coords[0].toFixed(4)}, ${newReport.coords[1].toFixed(4)}]`;
            triggerSMSAlert('+233 24 900 8000', msg);
            triggerPushNotification('Authority', `New Verified ${newReport.type}`, msg);

            const uniqueId = Math.random().toString(36).substr(2, 5);
            const logPayloadSMS = { id: `log-${Date.now()}-${uniqueId}-1`, timestamp: new Date().toISOString(), type: 'SMS', recipient: '+233 24 900 8000 (Local Responder)', message: msg };
            const logPayloadPush = { id: `log-${Date.now()}-${uniqueId}-2`, timestamp: new Date().toISOString(), type: 'Push', recipient: 'Authority Dashboard', message: `[FCM Verified Alert] ${msg}` };

            setAlertLogs(prevLogs => {
              const updatedLogs = [logPayloadSMS, logPayloadPush, ...prevLogs];
              localStorage.setItem('resilient_alert_logs', JSON.stringify(updatedLogs));
              return updatedLogs;
            });

            if (channelRef.current) {
              channelRef.current.postMessage({ type: 'NEW_ALERT_LOG', payload: logPayloadSMS });
              channelRef.current.postMessage({ type: 'NEW_ALERT_LOG', payload: logPayloadPush });
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

  // ─── Update report status ──────────────────────────────────────────────────
  const updateReportStatus = (id, newStatus) => {
    setReports(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: newStatus } : r);
      localStorage.setItem('resilient_reports', JSON.stringify(updated));
      return updated;
    });
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'REPORT_STATUS_UPDATE', payload: { id, status: newStatus } });
    }
  };

  // ─── Toggle checklist item ────────────────────────────────────────────────
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

  // ─── Broadcast SOS (with fresh GPS) ──────────────────────────────────────
  const broadcastSOS = useCallback((active) => {
    setSosAlert(active);

    if (active) {
      // Get fresh GPS position before broadcasting
      const dobroadcast = (coords) => {
        const senderInfo = {
          name: user.name,
          phone: user.phone,
          coords,
          timestamp: new Date().toISOString()
        };
        setSosSender(senderInfo);
        setSosFeedbacks([]);

        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'SOS_ALERT', payload: senderInfo });
        }
        
        SOSService.triggerSOS(user, coords);

        // Also fire browser notification for the sender's own confirmation
        sendBrowserNotification(
          '🚨 Your SOS Has Been Broadcast',
          `Your location [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}] has been sent to all active responders. Help is on the way.`
        );

        // Log SOS dispatch
        const sosLog = {
          id: `sos-log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'SOS',
          recipient: 'All Platform Users',
          message: `SOS BROADCAST by ${user.name} (${user.phone}) at [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]`
        };
        setAlertLogs(prev => {
          const updated = [sosLog, ...prev];
          localStorage.setItem('resilient_alert_logs', JSON.stringify(updated));
          return updated;
        });

        // Trigger SMS notification
        triggerSMSAlert(
          '+233 24 999 1111',
          `🚨 DISTRESS SOS BROADCAST: ${user.name} at GPS [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]. IMMEDIATE RESPONSE REQUIRED.`
        );

        // Deploy all drones to SOS location
        setDrones(prevDrones =>
          prevDrones.map(drone => ({
            ...drone,
            status: 'DEPLOYING TO SOS HAZARD AREA',
            coords
          }))
        );
      };

      // Try to get fresh precise GPS first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const freshCoords = [pos.coords.latitude, pos.coords.longitude];
            setUserCoords(freshCoords);
            setGpsAccuracy(pos.coords.accuracy);
            dobroadcast(freshCoords);
          },
          () => {
            // Fall back to last known coords
            dobroadcast(userCoords);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      } else {
        dobroadcast(userCoords);
      }
    } else {
      setSosSender(null);
      setSosFeedbacks([]);
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'SOS_RESET', payload: {} });
      }
      SOSService.cancelSOS(user);
    }
  }, [user, userCoords]);

  // ─── Submit SOS Feedback (seen by ALL users on the platform) ──────────────
  const submitSOSFeedback = (text) => {
    if (!text.trim() || !channelRef.current) return;

    const feedbackPayload = {
      id: `sos-fb-${Date.now()}`,
      senderPhone: user.phone,
      senderName: user.name,
      senderRole: user.role,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    // Add locally for sender (they won't get the broadcast back)
    setSosFeedbacks(prev => [feedbackPayload, ...prev]);

    // Broadcast to all other tabs locally
    channelRef.current.postMessage({ type: 'SOS_FEEDBACK', payload: feedbackPayload });
    
    // Persist to Firestore → syncs to ALL devices in real time
    SOSService.submitFeedback(feedbackPayload);
    
    // Also send via socket for low-latency relay
    wsService.sendSOSFeedback(feedbackPayload);

    toast.success('✅ Your response has been sent to the platform!');
  };

  // ─── Send direct peer feedback ─────────────────────────────────────────────
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
    toast.success('Feedback sent!');
  };

  // ─── Drone movement tick ───────────────────────────────────────────────────
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
            nextCoords = [currentCoords[0] + latDiff * 0.15, currentCoords[1] + lonDiff * 0.15];
          }
          return { ...drone, coords: nextCoords, battery: Math.max(10, drone.battery - 0.25), pathIndex: reached ? nextIndex : drone.pathIndex };
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
        gpsReady,
        gpsAccuracy,
        peers,
        reports,
        drones,
        sensors,
        sosAlert,
        sosSender,
        sosFeedbacks,
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
        submitSOSFeedback,
        setSosAlert,
        setSosSender,
        setSosFeedbacks,
        setSensors,
        setDrones
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
