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
      timestamp: serverTimestamp(),
      status: 'ACTIVE',
      expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };

    try {
      // Save to Firestore
      const sosRef = doc(db, 'alerts', sosId);
      await setDoc(sosRef, sosData);

      // Broadcast via WebSocket
      wsService.broadcastSOS({
        id: sosId,
        phone: user.phone,
        name: user.name,
        role: user.role,
        coords: coords,
        timestamp: new Date().toISOString()
      });

      // Here you can trigger Twilio SMS via Vercel function
      await this._triggerTwilioSMS(user, coords);

      return sosData;
    } catch (error) {
      console.error('Error triggering SOS:', error);
      return null;
    }
  }

  static async cancelSOS(user) {
    if (!user) return;

    try {
      // Find active SOS alerts for this user
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

  static async _triggerTwilioSMS(user, coords) {
    try {
      // Example call to a Vercel serverless function
      // Uncomment and use if a Vercel backend is present
      /*
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🚨 DISTRESS SOS BROADCAST: ${user.name} at GPS [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]. IMMEDIATE RESPONSE REQUIRED.`,
          to: '+233249991111'
        })
      });
      */
    } catch (error) {
      console.error('SMS trigger failed:', error);
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

