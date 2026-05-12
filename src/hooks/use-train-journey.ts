"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Station, CHUO_LINE_STATIONS } from "@/lib/stations";
import { requestForToken, onMessageListener } from "@/lib/firebase";

export function useTrainJourney() {
  const [startStation, setStartStation] = useState<Station | null>(null);
  const [endStation, setEndStation] = useState<Station | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const notificationTriggered = useRef(false);
  const wakeLockRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Determine the route stations
  const routeStations = useMemo(() => {
    if (!startStation || !endStation) return [];
    const startIndex = CHUO_LINE_STATIONS.findIndex((s) => s.id === startStation.id);
    const endIndex = CHUO_LINE_STATIONS.findIndex((s) => s.id === endStation.id);
    
    if (startIndex < endIndex) {
      return CHUO_LINE_STATIONS.slice(startIndex, endIndex + 1);
    } else {
      return CHUO_LINE_STATIONS.slice(endIndex, startIndex + 1).reverse();
    }
  }, [startStation, endStation]);

  const alarmStation = useMemo(() => {
    if (routeStations.length < 2) return null;
    return routeStations[routeStations.length - 2];
  }, [routeStations]);

  const calculatedAlarmTime = useMemo(() => {
    if (!departureTime || !arrivalTime || !startStation || !endStation) return null;

    const [depH, depM] = departureTime.split(":").map(Number);
    const [arrH, arrM] = arrivalTime.split(":").map(Number);

    const now = new Date();
    const depDate = new Date(now);
    depDate.setHours(depH, depM, 0, 0);
    const arrDate = new Date(now);
    arrDate.setHours(arrH, arrM, 0, 0);
    if (arrDate.getTime() < depDate.getTime()) arrDate.setDate(arrDate.getDate() + 1);

    // アラームは到着時刻の3分前に設定
    const alarmMs = arrDate.getTime() - (3 * 60 * 1000);
    return new Date(alarmMs);
  }, [departureTime, arrivalTime, startStation, endStation]);

  // Wake Lock for screen persistence
  const requestWakeLock = useCallback(async () => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        setIsWakeLockActive(true);
      } catch (err) {
        console.error("Wake Lock request failed:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isStarted) requestWakeLock();
    const handleVisibilityChange = () => {
      if (isStarted && document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isStarted, requestWakeLock]);

  // Audio setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const silentAudio = new Audio();
      silentAudio.loop = true;
      silentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
      audioRef.current = silentAudio;

      const alarmAudio = new Audio();
      alarmAudio.src = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
      alarmAudioRef.current = alarmAudio;
    }
  }, []);

  const triggerAlarm = useCallback(async () => {
    if (notificationTriggered.current) return;
    notificationTriggered.current = true;
    setIsAlarmActive(true);

    if (alarmAudioRef.current) {
      alarmAudioRef.current.play().catch(e => console.error("Alarm audio playback failed:", e));
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification("🚆 到着1駅前です！", {
        body: `${alarmStation?.name}駅を通過しました。${endStation?.name}駅への到着準備をしてください。`,
        vibrate: [200, 100, 200, 100, 200, 100, 400],
        tag: "train-alarm-notification",
        requireInteraction: true,
      } as any);
    }
  }, [alarmStation, endStation]);

  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      console.log("Foreground message received:", payload);
      triggerAlarm();
    });
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [triggerAlarm]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isStarted && calculatedAlarmTime) {
        const now = new Date();
        if (now >= calculatedAlarmTime && !notificationTriggered.current) {
          triggerAlarm();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, calculatedAlarmTime, triggerAlarm]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && departureTime && arrivalTime) {
      interval = setInterval(() => {
        const now = new Date();
        const [depH, depM] = departureTime.split(":").map(Number);
        const [arrH, arrM] = arrivalTime.split(":").map(Number);
        const depDate = new Date(now);
        depDate.setHours(depH, depM, 0, 0);
        const arrDate = new Date(now);
        arrDate.setHours(arrH, arrM, 0, 0);
        if (arrDate.getTime() < depDate.getTime()) arrDate.setDate(arrDate.getDate() + 1);
        const total = arrDate.getTime() - depDate.getTime();
        const current = now.getTime() - depDate.getTime();
        if (total > 0) {
          const p = Math.max(0, Math.min(100, (current / total) * 100));
          setProgress(p);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, departureTime, arrivalTime]);

  const startJourney = useCallback(async () => {
    setIsAlarmActive(false);
    notificationTriggered.current = false;
    setIsStarted(true);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback error:", e));
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      await Notification.requestPermission();
    }

    const token = await requestForToken();
    if (token) {
      setFcmToken(token);
      if (calculatedAlarmTime && alarmStation) {
        try {
          await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              alarmTime: calculatedAlarmTime.getTime(),
              title: "🚆 到着1駅前です！",
              body: `${alarmStation.name}駅を通過しました。${endStation?.name}駅への到着準備をしてください。`
            }),
          });
        } catch (e) {
          console.error("Failed to schedule alarm on server", e);
        }
      }
    }
  }, [calculatedAlarmTime, alarmStation, endStation]);

  const stopJourney = useCallback(() => {
    setIsStarted(false);
    setIsAlarmActive(false);
    notificationTriggered.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
  }, []);

  const testNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      await Notification.requestPermission();
    }

    const token = await requestForToken();
    if (token) {
      setFcmToken(token);
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            title: "🔔 テスト通知",
            body: "通知は正常に機能しています！"
          })
        });
      } catch (e) {
        console.error("Push test failed:", e);
      }
    }

    if (alarmAudioRef.current) {
      alarmAudioRef.current.play().catch(e => console.error("Test playback failed:", e));
      setTimeout(() => {
        alarmAudioRef.current?.pause();
        if (alarmAudioRef.current) alarmAudioRef.current.currentTime = 0;
      }, 2000);
    }
  };

  return {
    startStation,
    setStartStation,
    endStation,
    setEndStation,
    departureTime,
    setDepartureTime,
    arrivalTime,
    setArrivalTime,
    isStarted,
    calculatedAlarmTime,
    isAlarmActive,
    startJourney,
    stopJourney,
    testNotification,
    routeStations,
    alarmStation,
    isWakeLockActive,
    fcmToken,
    progress,
  };
}
