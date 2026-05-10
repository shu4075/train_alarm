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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  
  const notificationTriggered = useRef(false);
  const wakeLockRef = useRef<any>(null);

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
    return routeStations[routeStations.length - 2]; // One station before destination
  }, [routeStations]);

  const calculatedAlarmTime = useMemo(() => {
    if (!departureTime || !arrivalTime || !startStation || !endStation || !alarmStation) return null;

    const [depH, depM] = departureTime.split(":").map(Number);
    const [arrH, arrM] = arrivalTime.split(":").map(Number);

    const now = new Date();
    const depDate = new Date(now);
    depDate.setHours(depH, depM, 0, 0);
    const arrDate = new Date(now);
    arrDate.setHours(arrH, arrM, 0, 0);
    if (arrDate.getTime() < depDate.getTime()) arrDate.setDate(arrDate.getDate() + 1);

    const totalDurationMs = arrDate.getTime() - depDate.getTime();
    const totalDist = Math.abs(endStation.timeFromStart - startStation.timeFromStart);
    const alarmDist = Math.abs(alarmStation.timeFromStart - startStation.timeFromStart);
    const ratio = alarmDist / totalDist;

    const alarmMs = depDate.getTime() + (totalDurationMs * ratio);
    return new Date(alarmMs);
  }, [departureTime, arrivalTime, startStation, endStation, alarmStation]);

  const progress = useMemo(() => {
    if (!isStarted || !departureTime || !arrivalTime) return 0;
    const [depH, depM] = departureTime.split(":").map(Number);
    const [arrH, arrM] = arrivalTime.split(":").map(Number);
    const now = new Date();
    const depDate = new Date(now);
    depDate.setHours(depH, depM, 0, 0);
    const arrDate = new Date(now);
    arrDate.setHours(arrH, arrM, 0, 0);
    if (arrDate.getTime() < depDate.getTime()) arrDate.setDate(arrDate.getDate() + 1);
    const total = arrDate.getTime() - depDate.getTime();
    const current = now.getTime() - depDate.getTime();
    return Math.max(0, Math.min(100, (current / total) * 100));
  }, [isStarted, departureTime, arrivalTime]);

  // Main tick for checking alarm
  useEffect(() => {
    const interval = setInterval(() => {
      if (isStarted && calculatedAlarmTime) {
        const now = new Date();
        if (now >= calculatedAlarmTime) {
          setIsAlarmActive(true);
          
          // Trigger Notification ONCE
          if (!notificationTriggered.current) {
            triggerNotification();
            notificationTriggered.current = true;
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, calculatedAlarmTime]);

  // Wake Lock Management
  const requestWakeLock = useCallback(async () => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        setIsWakeLockActive(true);
        console.log("Wake Lock is active");
        
        wakeLockRef.current.addEventListener("release", () => {
          setIsWakeLockActive(false);
          console.log("Wake Lock was released");
        });
      } catch (err) {
        console.error(`${(err as Error).name}, ${(err as Error).message}`);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsWakeLockActive(false);
    }
  }, []);

  useEffect(() => {
    if (isStarted) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => releaseWakeLock();
  }, [isStarted, requestWakeLock, releaseWakeLock]);

  // Re-request wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === "visible" && isStarted) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isStarted, requestWakeLock]);

  // Request FCM Token
  useEffect(() => {
    if (typeof window !== "undefined") {
      requestForToken().then(token => {
        if (token) setFcmToken(token);
      });

      onMessageListener().then((payload: any) => {
        console.log("Foreground message: ", payload);
        if (payload.notification) {
          setIsAlarmActive(true);
        }
      });
    }
  }, []);

  const triggerNotification = useCallback(async () => {
    // 1. Local Notification (Existing logic)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (Notification.permission === "granted") {
        registration.showNotification("🚆 TrainAlarm: Wake Up!", {
          body: `Approaching ${alarmStation?.name || "the next station"}. Next is ${endStation?.name}.`,
          icon: "/next.svg",
          badge: "/next.svg",
          tag: "train-alarm",
          requireInteraction: true,
          vibrate: [200, 100, 200],
        } as any);
      }
    }

    // 2. Server-side Push (New logic for background reliability)
    if (fcmToken) {
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: fcmToken,
            title: "🚆 TrainAlarm: Wake Up!",
            body: `Approaching ${alarmStation?.name || "the next station"}. Next is ${endStation?.name}.`,
          }),
        });
      } catch (err) {
        console.error("Failed to send server-side push:", err);
      }
    }
  }, [alarmStation, endStation, fcmToken]);

  const testNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification permission denied. Please enable it in your browser settings.");
        return;
      }
    }

    if (fcmToken) {
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: fcmToken,
            title: "🔔 Test Push Notification",
            body: "FCM server-side push is working!",
          }),
        });
      } catch (err) {
        console.error("Failed to send test push:", err);
      }
    }

    // Also show local test
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification("🔔 Test Local Notification", {
        body: "Local SW notification is working!",
        icon: "/next.svg",
      } as any);
    }
  };

  const startJourney = useCallback(async () => {
    setIsAlarmActive(false);
    notificationTriggered.current = false;
    setIsStarted(true);

    // Schedule background notification on server
    if (fcmToken && calculatedAlarmTime) {
      try {
        await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: fcmToken,
            alarmTime: calculatedAlarmTime.getTime(),
            title: "🚆 TrainAlarm: Wake Up!",
            body: `Approaching ${alarmStation?.name || "the next station"}. Next is ${endStation?.name}.`,
          }),
        });
        console.log("Alarm scheduled on server");
      } catch (err) {
        console.error("Failed to schedule alarm on server:", err);
      }
    }
  }, [fcmToken, calculatedAlarmTime, alarmStation, endStation]);

  const stopJourney = useCallback(() => {
    setIsStarted(false);
    setIsAlarmActive(false);
    notificationTriggered.current = false;
    setElapsedSeconds(0);
  }, []);

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
    progress,
    isAlarmActive,
    startJourney,
    stopJourney,
    testNotification,
    routeStations,
    alarmStation,
    isWakeLockActive,
    fcmToken,
  };
}
