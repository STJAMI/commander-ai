import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer, Flame, Award, Coffee, Zap, FastForward, Volume2, VolumeX, Music, CloudRain, Waves } from "lucide-react";
import { motion } from "motion/react";
import { startAmbientSound, stopAmbientSound, updateAmbientVolume } from "../utils/audioEngine";

interface PomodoroProps {
  onFocusComplete: (minutes: number) => void;
  streak: number;
  onTriggerTestCelebrate?: () => void;
}

type Mode = '25' | '50' | '90' | 'custom';

export default function Pomodoro({ onFocusComplete, streak, onTriggerTestCelebrate }: PomodoroProps) {
  const [mode, setMode] = useState<Mode>('25');
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ambient sound system states
  const [ambientMode, setAmbientMode] = useState<'none' | 'rain' | 'ocean' | 'lofi'>(() => {
    return (localStorage.getItem("study_commander_ambient_mode") as any) || 'none';
  });
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    const saved = localStorage.getItem("study_commander_ambient_volume");
    return saved ? parseFloat(saved) : 0.4;
  });
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  const getModeMinutes = (m: Mode): number => {
    switch (m) {
      case '25': return 25;
      case '50': return 50;
      case '90': return 90;
      case 'custom': return customMinutes;
    }
  };

  const currentDuration = getModeMinutes(mode) * 60;

  // Sync time when mode changes
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(currentDuration);
      setIsBreak(false);
    }
  }, [mode, customMinutes]);

  // Handle countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isBreak]);

  // Synchronize playing focus ambient tracks
  useEffect(() => {
    const shouldPlay = (isRunning && !isBreak) || isPlayingPreview;
    if (shouldPlay && ambientMode !== 'none') {
      startAmbientSound(ambientMode, ambientVolume);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [isRunning, isBreak, isPlayingPreview, ambientMode]);

  // Save selected ambient mode configuration
  useEffect(() => {
    localStorage.setItem("study_commander_ambient_mode", ambientMode);
    if (ambientMode === 'none') {
      setIsPlayingPreview(false);
    }
  }, [ambientMode]);

  // Apply volume changes live
  useEffect(() => {
    updateAmbientVolume(ambientVolume);
    localStorage.setItem("study_commander_ambient_volume", ambientVolume.toString());
  }, [ambientVolume]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playAlarm();
    
    const minutesCompleted = getModeMinutes(mode);
    if (!isBreak) {
      onFocusComplete(minutesCompleted);
      // Switch automatically to break mode
      setIsBreak(true);
      const breakMinutes = mode === '25' ? 5 : mode === '50' ? 10 : mode === '90' ? 20 : Math.round(minutesCompleted * 0.2);
      setTimeLeft(breakMinutes * 60);
    } else {
      setIsBreak(false);
      setTimeLeft(currentDuration);
    }
  };

  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      // Pleasant double chime
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log("Audio alarm played via fallback:", e);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(currentDuration);
  };

  const selectMode = (m: Mode) => {
    setIsRunning(false);
    setMode(m);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((currentDuration - timeLeft) / currentDuration) * 100;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-full" id="pomodoro-timer-widget">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-[13px]">Focus Terminal</h3>
          </div>
          <motion.div 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              boxShadow: ["0 0 0 rgba(245, 158, 11, 0)", "0 0 10px rgba(245, 158, 11, 0.35)", "0 0 0 rgba(245, 158, 11, 0)"]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.2,
              ease: "easeInOut"
            }}
            onClick={() => {
              if (onTriggerTestCelebrate) {
                onTriggerTestCelebrate();
              }
            }}
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-amber-700 text-[10px] font-extrabold cursor-pointer group relative shadow-sm"
            title="Click to trigger celebration!"
            id="pomodoro-streak-badge"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 group-hover:scale-115 transition-transform" />
            <span>{streak} Day Streak</span>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap pointer-events-none border border-slate-800 z-50">
              Demo Test ✨
            </span>
          </motion.div>
        </div>

        {/* Mode Selectors */}
        <div className="grid grid-cols-4 gap-1.5 mb-6 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
          {(['25', '50', '90', 'custom'] as Mode[]).map((m) => (
            <button
              key={m}
              id={`pomo-mode-${m}`}
              onClick={() => selectMode(m)}
              className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                mode === m
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-800"
              }`}
            >
              {m === 'custom' ? 'Custom' : `${m}m`}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        {mode === 'custom' && !isRunning && (
          <div className="mb-4 flex items-center justify-between gap-2 px-1">
            <span className="text-xs text-slate-500 font-medium">Minutes:</span>
            <input
              type="number"
              min="1"
              max="240"
              id="custom-timer-input"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center text-xs border border-slate-200 rounded-lg px-1 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        {/* Circular Timing Display Component */}
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center my-4">
          <svg className="absolute w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="80"
              cy="80"
              r="72"
              className="stroke-slate-50 fill-none"
              strokeWidth="6"
            />
            {/* Foreground Active Circle */}
            <circle
              cx="80"
              cy="80"
              r="72"
              className={`fill-none transition-all duration-300 ${
                isBreak ? "stroke-emerald-500" : "stroke-indigo-600"
              }`}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 72}
              strokeDashoffset={2 * Math.PI * 72 * (1 - progressPercent / 100)}
              strokeLinecap="round"
            />
          </svg>

          <div className="text-center z-10">
            <span className="block text-3xl font-mono font-bold text-slate-800 tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full mt-1.5 ${
              isBreak 
                ? "bg-emerald-50 text-emerald-700" 
                : "bg-indigo-50 text-indigo-700"
            }`}>
              {isBreak ? (
                <>
                  <Coffee className="w-3 h-3" />
                  <span>Break Time</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Focusing</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Ambient concentration sounds control shelf */}
        <div className="mt-5 border-t border-slate-100 pt-4 text-left" id="ambient-sound-shelf">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Music className="w-4 h-4 text-indigo-600 animate-spin-slow" />
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">Ambient Sound Modulator</span>
            </div>
            {isRunning && !isBreak && ambientMode !== 'none' && (
              <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase animate-pulse">
                Playing 🔊
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { id: 'none', icon: '🔇', title: 'Mute' },
              { id: 'rain', icon: '🌧️', title: 'Rain' },
              { id: 'ocean', icon: '🌊', title: 'Ocean' },
              { id: 'lofi', icon: '🎹', title: 'Lo-Fi' }
            ].map((sound) => (
              <button
                key={sound.id}
                onClick={() => {
                  setAmbientMode(sound.id as any);
                  if (sound.id !== 'none') {
                    setIsPlayingPreview(true);
                  }
                }}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold transition text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                  ambientMode === sound.id
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-slate-50 border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                <span className="text-sm">{sound.icon}</span>
                <span className="text-[9px]">{sound.title}</span>
              </button>
            ))}
          </div>

          {ambientMode !== 'none' && (
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex items-center justify-between gap-3" id="ambient-volume-slider-section">
              <div className="flex items-center gap-2 flex-1">
                {ambientVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-500" />}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  title="Tune volume slider"
                />
                <span className="text-[10px] font-mono font-bold text-slate-500">{Math.round(ambientVolume * 100)}%</span>
              </div>
              <button
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg uppercase cursor-pointer border transition ${
                  isPlayingPreview 
                    ? "bg-indigo-600 border-indigo-700 hover:bg-indigo-750 text-white" 
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {isPlayingPreview ? "Stop" : "Preview"}
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="flex gap-2.5 mt-4">
        <button
          onClick={toggleTimer}
          id="btn-pomo-toggle"
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
            isRunning
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : isBreak
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start</span>
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          id="btn-pomo-reset"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsRunning(true);
            setTimeLeft(3);
          }}
          id="btn-pomo-fast"
          className="p-2.5 rounded-xl border border-slate-200 text-amber-500 hover:bg-amber-50 cursor-pointer hover:border-amber-300 transition"
          title="Fast-forward focus count to 3 seconds for instant goal test!"
        >
          <FastForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
