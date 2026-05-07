"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Station, CHUO_LINE_STATIONS } from "@/lib/stations";

export function useTrainJourney() {
  const [startStation, setStartStation] = useState<Station | null>(null);
  const [endStation, setEndStation] = useState<Station | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  
  const notificationTriggered = useRef(false);

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

  const triggerNotification = useCallback(async () => {
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
        });
      } else {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          registration.showNotification("🚆 TrainAlarm: Wake Up!", {
            body: `Approaching ${alarmStation?.name || "the next station"}. Next is ${endStation?.name}.`,
            icon: "/next.svg",
            badge: "/next.svg",
            tag: "train-alarm",
            requireInteraction: true,
            vibrate: [200, 100, 200],
          });
        }
      }
    } else if (typeof window !== "undefined" && "Notification" in window) {
      // Fallback for browsers without Service Worker but with Notification API
      if (Notification.permission === "granted") {
        new Notification("🚆 TrainAlarm: Wake Up!", {
          body: `Approaching ${alarmStation?.name || "the next station"}. Next is ${endStation?.name}.`,
          requireInteraction: true,
          tag: "train-alarm"
        });
      } else {
        Notification.requestPermission();
      }
    }
  }, [alarmStation, endStation]);

  const testNotification = async () => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (Notification.permission === "granted") {
        registration.showNotification("🔔 Test Notification", {
          body: "Notifications are working correctly!",
          icon: "/next.svg",
          badge: "/next.svg",
          vibrate: [100, 50, 100],
        });
      } else {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          registration.showNotification("🔔 Test Notification", {
            body: "Notifications are working correctly!",
            icon: "/next.svg",
            badge: "/next.svg",
            vibrate: [100, 50, 100],
          });
        }
      }
    } else if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("🔔 Test Notification", {
          body: "Notifications are working correctly!",
        });
      } else {
        Notification.requestPermission();
      }
    }
  };

  const startJourney = useCallback(() => {
    setIsAlarmActive(false);
    notificationTriggered.current = false;
    setIsStarted(true);
  }, []);

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
  };
}
