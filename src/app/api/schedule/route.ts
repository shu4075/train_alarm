import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function POST(request: NextRequest) {
  try {
    const { token, alarmTime, title, body } = await request.json();

    if (!token || !alarmTime) {
      return NextResponse.json({ error: 'Token and alarmTime are required' }, { status: 400 });
    }

    // alarmTime should be a timestamp (ms)
    // We store it as a sorted set where the score is the timestamp
    // The member is a JSON string of the notification details
    const alarmDetail = JSON.stringify({
      token,
      title: title || '🚆 TrainAlarm: Wake Up!',
      body: body || 'Approaching your destination.',
      alarmTime
    });

    // Use a sorted set 'alarms'
    await redis.zadd('alarms', { score: alarmTime, member: alarmDetail });

    console.log(`Scheduled alarm for ${new Date(alarmTime).toLocaleString()} for token ${token.substring(0, 10)}...`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error scheduling alarm:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
