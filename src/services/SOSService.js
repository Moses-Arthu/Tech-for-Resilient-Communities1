import { collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { wsService } from './WebSocketService';

export class SOSService {
  static async triggerSOS(user, coords) {
    if (!user || !coords) return null;
    
    const sosId = `sos_${user.phone}_${Date.now()}`;
    const sosData = {
      id: sosId,
      userId: user.phone,
      userName: user.name,
      userRole: user.role,
      type: 'SOS',
      severity: 'CRITICAL',
      location: coords,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
      status: 'ACTIVE',
      expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    try {
      // 1. Save to Firestore (this triggers the onSnapshot on ALL other devices)
      const sosRef = doc(db, 'alerts', sosId);
      await setDoc(sosRef, sosData);

      // 2. Broadcast via WebSocket (low-latency relay for same-session users)
      wsService.broadcastSOS({
        id: sosId,
        phone: user.phone,
        name: user.name,
        role: user.role,
        coords,
        timestamp: new Date().toISOString()
      });

      // 3. Blast FCM push to ALL registered devices (iPhones, Androids, desktops)
      await this._blastPushToAllDevices(user, coords);

      return sosData;
    } catch (error) {
      console.error('Error triggering SOS:', error);
      return null;
    }
  }

  // ── Collect all FCM tokens from Firestore and send push via Vercel API ────
  static async _blastPushToAllDevices(sender, coords) {
    try {
      // Get every registered user from Firestore
      const usersSnap = await getDocs(collection(db, 'users'));
      const tokens = [];

      usersSnap.forEach((docSnap) => {
        const u = docSnap.data();
        // Include every user who has an FCM token, except the sender
        if (u.fcmToken && u.phone !== sender.phone) {
          tokens.push(u.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log('[SOS] No other registered devices to notify.');
        return;
      }

      console.log(`[SOS] Blasting FCM push to ${tokens.length} device(s)…`);

      // Call our Vercel serverless function
      const res = await fetch('/api/notify-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: sender.name,
          senderPhone: sender.phone,
          coords,
          tokens,
        }),
      });

      const result = await res.json();
      console.log(`[SOS] Push result: ${result.sent} sent, ${result.failed} failed`);
    } catch (error) {
      console.error('[SOS] Error blasting push notifications:', error);
    }
  }

  static async cancelSOS(user) {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', user.phone),
        where('status', '==', 'ACTIVE')
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnap) => {
        await updateDoc(docSnap.ref, {
          status: 'RESOLVED',
          resolvedAt: serverTimestamp()
        });
      });

      wsService.resetSOS();
    } catch (error) {
      console.error('Error canceling SOS:', error);
    }
  }

  static async getActiveAlerts() {
    try {
      const q = query(
        collection(db, 'alerts'),
        where('status', '==', 'ACTIVE')
      );
      const querySnapshot = await getDocs(q);
      const alerts = [];
      querySnapshot.forEach((doc) => {
        alerts.push(doc.data());
      });
      return alerts;
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      return [];
    }
  }

  static async submitFeedback(feedbackPayload) {
    try {
      const fbRef = doc(collection(db, 'sos_feedback'), feedbackPayload.id);
      await setDoc(fbRef, {
        ...feedbackPayload,
        status: 'ACTIVE'
      });
    } catch (error) {
      console.error('Error saving feedback to Firestore:', error);
    }
  }
}
