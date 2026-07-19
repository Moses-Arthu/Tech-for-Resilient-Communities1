// Vercel Serverless Function: /api/notify-sos.js
// Called when any user triggers SOS — sends FCM push to ALL registered devices
// (iPhones, Androids, laptops, tablets) even when the app is closed.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { senderName, senderPhone, coords, tokens } = body;

  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No tokens provided' }), { status: 200 });
  }

  const SERVER_KEY = process.env.FIREBASE_SERVER_KEY;
  if (!SERVER_KEY) {
    return new Response(JSON.stringify({ error: 'FIREBASE_SERVER_KEY not configured' }), { status: 500 });
  }

  const locationText = coords
    ? `📍 ${coords[0].toFixed(4)}°N, ${coords[1].toFixed(4)}°E`
    : 'Location broadcast on map';

  // Filter out the sender's own token
  const recipientTokens = (tokens || []).filter(t => t && t.trim() !== '');

  if (recipientTokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // FCM Legacy HTTP API — sends to all recipient tokens at once
  const fcmPayload = {
    registration_ids: recipientTokens,
    priority: 'high',
    notification: {
      title: '🚨 SOS EMERGENCY — Resilient Ghana',
      body: `${senderName || 'A user'} has triggered a distress beacon!\n${locationText}\nTap to view on the Live Map.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      sound: 'default',
      click_action: '/map',
      tag: 'sos-alert',
    },
    data: {
      type: 'SOS_ALERT',
      senderName: senderName || '',
      senderPhone: senderPhone || '',
      lat: coords ? String(coords[0]) : '',
      lng: coords ? String(coords[1]) : '',
      url: '/map',
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channel_id: 'sos_alerts',
        vibrate_timings: ['0.5s', '0.2s', '0.5s', '0.2s', '0.5s'],
        notification_priority: 'PRIORITY_MAX',
        visibility: 'PUBLIC',
      },
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          alert: {
            title: '🚨 SOS EMERGENCY',
            body: `${senderName || 'A user'} needs help! ${locationText}`,
          },
          sound: 'default',
          badge: 1,
          'content-available': 1,
          'mutable-content': 1,
        },
      },
    },
    webpush: {
      headers: { Urgency: 'high' },
      notification: {
        title: '🚨 SOS EMERGENCY — Resilient Ghana',
        body: `${senderName || 'A user'} needs help!\n${locationText}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        tag: 'sos-alert',
        renotify: true,
        actions: [
          { action: 'view-map', title: '🗺️ View on Map' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
        data: { url: '/map' },
      },
    },
  };

  try {
    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${SERVER_KEY}`,
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmData = await fcmRes.json();
    console.log('[notify-sos] FCM response:', JSON.stringify(fcmData));

    return new Response(
      JSON.stringify({
        sent: fcmData.success || 0,
        failed: fcmData.failure || 0,
        results: fcmData.results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[notify-sos] FCM error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
