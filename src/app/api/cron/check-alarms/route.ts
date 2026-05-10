import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import admin from 'firebase-admin';

const redis = Redis.fromEnv();

// Initialize Firebase Admin (Same as notify route)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function GET(request: NextRequest) {
  // Check authorization (Vercel Cron sends a secret header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = Date.now();
    
    // Get all alarms whose score (timestamp) is <= now
    const dueAlarms = await redis.zrange('alarms', 0, now, { byScore: true });

    if (dueAlarms.length === 0) {
      return NextResponse.json({ message: 'No due alarms' });
    }

    console.log(`Processing ${dueAlarms.length} due alarms...`);

    const results = [];

    for (const alarmStr of dueAlarms) {
      const alarm = typeof alarmStr === 'string' ? JSON.parse(alarmStr) : alarmStr;
      
      try {
        const message = {
          notification: {
            title: alarm.title,
            body: alarm.body,
          },
          token: alarm.token,
          android: { priority: 'high' as const, notification: { sound: 'default' } },
          apns: { payload: { aps: { sound: 'default', contentAvailable: true } } },
        };

        await admin.messaging().send(message);
        results.push({ token: alarm.token, status: 'sent' });
        
        // Remove the alarm from Redis after sending
        await redis.zrem('alarms', alarmStr);
      } catch (err) {
        console.error(`Failed to send alarm to ${alarm.token}:`, err);
        results.push({ token: alarm.token, status: 'failed', error: (err as Error).message });
        
        // Optionally: Decide whether to remove failed alarms or keep them for retry
        await redis.zrem('alarms', alarmStr);
      }
    }

    return NextResponse.json({ processed: dueAlarms.length, results });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
