"use client";

import { useTrainJourney } from "@/hooks/use-train-journey";
import { CHUO_LINE_STATIONS, Station } from "@/lib/stations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Train, Bell, MapPin, Navigation, ArrowRightLeft, X, Clock, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function TrainAlarmPage() {
  const journey = useTrainJourney();
  const [accentColor, setAccentColor] = useState("orange"); // orange, blue, purple, cyan

  const colorMap = {
    orange: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500", shadow: "shadow-orange-500/30", ring: "focus:ring-orange-500/50" },
    blue: { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", shadow: "shadow-blue-500/30", ring: "focus:ring-blue-500/50" },
    purple: { bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", shadow: "shadow-purple-500/30", ring: "focus:ring-purple-500/50" },
    cyan: { bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-500", shadow: "shadow-cyan-500/30", ring: "focus:ring-cyan-500/50" },
  };

  const activeColor = colorMap[accentColor as keyof typeof colorMap];

  // Helper to format seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30 overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              TrainAlarm
            </h1>
            <p className="text-white/40 text-sm">
              {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              variant="outline" 
              size="sm"
              onClick={journey.testNotification}
              className={`text-[10px] font-black tracking-widest ${journey.fcmToken ? 'border-green-500/50 text-green-500' : 'border-white/20 text-white/60'} rounded-full px-4`}
            >
              {journey.fcmToken ? 'NOTIFICATIONS ON' : 'ENABLE NOTIFICATIONS'}
            </Button>
            <div className={`h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md`}>
              <Train className={`w-5 h-5 ${activeColor.text}`} />
            </div>
          </div>
        </header>

        {/* FCM Status Indicator */}
        <div className="flex justify-center mb-4">
          {journey.fcmToken ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Notification Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Setting up notifications...</span>
            </div>
          )}
        </div>

        {/* Theme Selector */}
        <div className="flex justify-center gap-4 mb-8">
          {Object.keys(colorMap).map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={`w-6 h-6 rounded-full ${colorMap[color as keyof typeof colorMap].bg} ${accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-40'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!journey.isStarted ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Station Selection */}
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
                <div className="relative">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 ml-1 block">
                    Departure Station
                  </label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold"
                    value={journey.startStation?.id || ""}
                    onChange={(e) => {
                      const s = CHUO_LINE_STATIONS.find((st) => st.id === e.target.value);
                      if (s) journey.setStartStation(s);
                    }}
                  >
                    <option value="" disabled>Select station...</option>
                    {CHUO_LINE_STATIONS.map((s) => (
                      <option key={s.id} value={s.id} className="bg-neutral-900">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 ml-1 block">
                    Arrival Station
                  </label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold"
                    value={journey.endStation?.id || ""}
                    onChange={(e) => {
                      const s = CHUO_LINE_STATIONS.find((st) => st.id === e.target.value);
                      if (s) journey.setEndStation(s);
                    }}
                  >
                    <option value="" disabled>Select destination...</option>
                    {CHUO_LINE_STATIONS.map((s) => (
                      <option key={s.id} value={s.id} className="bg-neutral-900">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1 block">
                      Dep. Time
                    </label>
                    <input
                      type="time"
                      value={journey.departureTime}
                      onChange={(e) => journey.setDepartureTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xl font-black appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all color-scheme-dark"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1 block">
                      Arr. Time
                    </label>
                    <input
                      type="time"
                      value={journey.arrivalTime}
                      onChange={(e) => journey.setArrivalTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xl font-black appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                <Button
                  onClick={journey.startJourney}
                  disabled={!journey.startStation || !journey.endStation || !journey.departureTime || !journey.arrivalTime}
                  className={`w-full h-16 rounded-[1.5rem] ${activeColor.bg} hover:brightness-110 text-black font-black text-lg shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all active:scale-95 disabled:opacity-20 mt-4`}
                >
                  START MONITORING
                </Button>
              </div>

              {/* Info Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
                <div className="bg-white/10 p-2 rounded-full">
                  <Clock className="w-4 h-4 text-white/60" />
                </div>
                <p className="text-xs text-white/40 leading-relaxed font-medium">
                  Enter your train's scheduled times. The alarm will trigger automatically <span className="text-white/80 font-bold">one station before</span> your destination.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              {/* Journey Card */}
              <div className="bg-gradient-to-br from-neutral-900 to-black border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                {/* Progress Bar Background */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full" />
                <motion.div 
                  className={`absolute bottom-0 left-0 h-1 ${activeColor.bg} shadow-[0_0_15px_rgba(0,0,0,0.8)]`}
                  initial={{ width: 0 }}
                  animate={{ width: `${journey.progress}%` }}
                />

                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-4xl font-black tracking-tighter">{journey.departureTime}</div>
                      <div className="text-lg font-bold text-white/60">{journey.startStation?.name}</div>
                      <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">DEPARTURE</div>
                    </div>
                    <div className="pt-4">
                      <div className="bg-white/5 p-2 rounded-full border border-white/10">
                        <ChevronRight className={`w-6 h-6 ${activeColor.text}`} />
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-4xl font-black tracking-tighter ${activeColor.text}`}>{journey.arrivalTime}</div>
                      <div className="text-lg font-bold">{journey.endStation?.name}</div>
                      <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">ARRIVAL</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center py-6 border-y border-white/5">
                    <div className="text-sm font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Estimated Alarm</div>
                    <div className="text-5xl font-black tracking-tighter flex items-center gap-3">
                      <Bell className={`w-8 h-8 ${activeColor.text} animate-bounce`} />
                      {journey.calculatedAlarmTime?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`text-xs font-bold ${activeColor.text} opacity-50 mt-2`}>
                      AT {journey.alarmStation?.name} STATION
                    </div>
                  </div>

                  <Button 
                    onClick={journey.stopJourney}
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all active:scale-95"
                  >
                    CANCEL ALARM
                  </Button>
                </div>
              </div>

              {/* Status Update */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Monitoring Journey</span>
                </div>
                
                <div className="flex flex-col items-center gap-2 mt-4 px-6 text-center">
                  {journey.isWakeLockActive ? (
                    <Badge variant="outline" className={`${activeColor.bg}/10 ${activeColor.text} ${activeColor.border}/20 py-1 px-4 rounded-full text-[10px] font-black`}>
                      SLEEP PREVENTION ACTIVE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 py-1 px-4 rounded-full text-[10px] font-black">
                      SLEEP PREVENTION INACTIVE
                    </Badge>
                  )}
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-tighter leading-tight max-w-[240px]">
                    Keep this tab open for the most reliable alarm. <br />
                    Background notifications may be delayed by the OS.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alarm Modal Overlay */}
      <AnimatePresence>
        {journey.isAlarmActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`relative ${activeColor.bg} text-black p-10 rounded-[3rem] w-full max-w-sm text-center shadow-[0_0_100px_rgba(0,0,0,0.5)]`}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="mb-6 flex justify-center"
              >
                <Bell className="w-24 h-24" />
              </motion.div>
              <h2 className="text-5xl font-black tracking-tighter mb-2">WAKE UP!</h2>
              <p className="text-lg font-bold mb-8 opacity-80">
                Approaching <span className="underline decoration-4">{journey.alarmStation?.name}</span>.<br />
                Next is {journey.endStation?.name}.
              </p>
              <Button
                onClick={journey.stopJourney}
                className="w-full h-20 rounded-[2rem] bg-black text-white hover:bg-black/90 text-xl font-black transition-all active:scale-95 shadow-2xl"
              >
                I'M AWAKE
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
