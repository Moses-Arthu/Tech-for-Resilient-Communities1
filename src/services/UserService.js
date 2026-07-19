import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, messaging } from "../firebase/config";
import { getToken } from "firebase/messaging";

export class UserService {
  static async registerOrUpdateUser(user) {
    if (!user || !user.phone) return null;
    
    try {
      const userRef = doc(db, "users", user.phone);
      const userSnap = await getDoc(userRef);

      const userData = {
        phone: user.phone,
        name: user.name || "Anonymous",
        role: user.role || "Citizen",
        lastActive: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, userData);
      } else {
        await updateDoc(userRef, userData);
      }

      // Try to get FCM Token if permission is granted
      this.updateFCMToken(user.phone);

      return userData;
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
      return null;
    }
  }

  static async updateFCMToken(phone) {
    try {
      if (!messaging) return;
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        if (token) {
          const userRef = doc(db, "users", phone);
          await updateDoc(userRef, {
            fcmToken: token
          });
        }
      }
    } catch (error) {
      console.warn("FCM token could not be retrieved:", error);
    }
  }

  static async updateUserLocation(phone, coords) {
    if (!phone || !coords) return;
    try {
      const userRef = doc(db, "users", phone);
      await updateDoc(userRef, {
        lastLocation: coords,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user location:", error);
    }
  }

  static async getUser(phone) {
    try {
      const userRef = doc(db, "users", phone);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }
}
