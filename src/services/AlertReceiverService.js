export class AlertReceiverService {
  static async requestNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }

  static playEmergencySound(type = 'siren') {
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
  }

  static showBrowserNotification(title, body, icon = '🚨') {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, {
        body,
        icon: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        badge: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        tag: 'sos-alert',
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300]
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      console.error('Could not show browser notification:', e);
    }
  }

  static handleIncomingSOS(sosData) {
    this.playEmergencySound('siren');
    this.showBrowserNotification(
      `🚨 SOS ALERT — ${sosData.name}`,
      `Emergency broadcast from ${sosData.name} at coordinates [${sosData.coords[0].toFixed(4)}, ${sosData.coords[1].toFixed(4)}]. Immediate assistance required!`
    );
  }

  static handleIncomingFeedback(feedbackData) {
    this.playEmergencySound('beep');
    this.showBrowserNotification(
      `💬 Response from ${feedbackData.senderName}`,
      feedbackData.text
    );
  }
}
