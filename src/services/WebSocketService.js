import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.callbacks = new Map();
    this.hasLoggedError = false;
  }

  connect(user) {
    if (!user || !user.phone) return;
    this.userId = user.phone;

    // Connect to the socket server only if explicitly configured and not default localhost placeholder
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!socketUrl || !socketUrl.trim() || socketUrl.includes('localhost:3001')) {
      // No external WebSocket server configured; peer-to-peer sync is handled via native BroadcastChannel
      return;
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(socketUrl, {
      query: {
        userId: user.phone,
        name: user.name,
        role: user.role
      },
      reconnection: false,
      timeout: 3000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected to relay server:', this.socket.id);
      this.hasLoggedError = false;
    });

    this.socket.on('connect_error', () => {
      if (!this.hasLoggedError) {
        console.info(`[WebSocket] Relay server at ${socketUrl} unavailable. Operating in native BroadcastChannel mode.`);
        this.hasLoggedError = true;
      }
      this.disconnect();
    });

    this.socket.on('sos_alert_received', (data) => {
      this._triggerCallback('SOS_ALERT', data);
    });

    this.socket.on('sos_reset_received', (data) => {
      this._triggerCallback('SOS_RESET', data);
    });

    this.socket.on('sos_feedback_received', (data) => {
      this._triggerCallback('SOS_FEEDBACK', data);
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from relay server');
    });
  }

  broadcastSOS(sosData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('broadcast_sos', sosData);
    }
  }

  resetSOS() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('reset_sos', { userId: this.userId });
    }
  }

  sendSOSFeedback(feedbackData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sos_feedback', feedbackData);
    }
  }

  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  off(event, callback) {
    if (this.callbacks.has(event)) {
      const filtered = this.callbacks.get(event).filter(cb => cb !== callback);
      this.callbacks.set(event, filtered);
    }
  }

  _triggerCallback(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach(cb => cb(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();
