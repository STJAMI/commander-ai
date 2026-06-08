import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Award, Sparkles, CheckCircle2, Play } from "lucide-react";

interface CelebrationOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  streak: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: "circle" | "square" | "triangle" | "star";
  size: number;
  rotation: number;
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = [
  "#FFC107", // Gold
  "#FF5722", // Orange
  "#4CAF50", // Emerald Green
  "#2196F3", // Blue
  "#9C27B0", // Purple
  "#E91E63", // Pink
  "#00BCD4", // Cyan
];

export default function CelebrationOverlay({
  isVisible,
  onClose,
  title = "Daily Goal Accomplished!",
  message = "Superb focus level, Jami! Your academic success is fully on target.",
  streak,
}: CelebrationOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visualStreak, setVisualStreak] = useState(streak);

  // Sync internal display streak with prop, but let it animate when opening
  useEffect(() => {
    if (isVisible) {
      setVisualStreak(Math.max(0, streak - 1));
      const timeout = setTimeout(() => {
        setVisualStreak(streak);
        playChimeChords();
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, streak]);

  // Generate confetti on Mount/Trigger
  useEffect(() => {
    if (isVisible) {
      const generated: Particle[] = Array.from({ length: 90 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // random percentage horizontal
        y: -10 - Math.random() * 20, // start above viewport
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: (["circle", "square", "triangle", "star"] as const)[Math.floor(Math.random() * 4)],
        size: Math.random() * 12 + 6,
        rotation: Math.random() * 360,
        delay: Math.random() * 1.5,
        duration: Math.random() * 2.5 + 2.5,
      }));
      setParticles(generated);

      // Auto dismiss after 6 seconds to prevent annoying blocking
      const dismissTimer = setTimeout(() => {
        onClose();
      }, 6500);
      return () => clearTimeout(dismissTimer);
    } else {
      setParticles([]);
    }
  }, [isVisible]);

  // Synth elegant triumphant chord using Browser Web Audio Context
  const playChimeChords = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playChimeNote = (freq: number, startTime: number, len: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "triangle"; // softer and sweeter than sine/square
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Add a secondary subtle sine oscillator for sparkling depth
        const sparkleOsc = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkleOsc.type = "sine";
        sparkleOsc.frequency.setValueAtTime(freq * 2, startTime); // One octave up
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + len);
        
        sparkleGain.gain.setValueAtTime(0, startTime);
        sparkleGain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.05);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, startTime + len * 0.7);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + len);
        sparkleOsc.start(startTime);
        sparkleOsc.stop(startTime + len);
      };

      const now = ctx.currentTime;
      // Arpeggiated C-major 9th Chord for high-fidelity accomplishment feel
      const root = 261.63; // C4
      playChimeNote(root, now, 1.8, 0.15); // C4
      playChimeNote(root * (5/4), now + 0.15, 1.6, 0.15); // E4
      playChimeNote(root * (3/2), now + 0.3, 1.5, 0.15); // G4
      playChimeNote(root * (15/8), now + 0.45, 1.3, 0.15); // B4 (Major 7th sparkle)
      playChimeNote(root * 2.25, now + 0.6, 1.5, 0.2); // D5 (Sweet 9th tone resolution)
    } catch (err) {
      console.log("Offline chord play skipped:", err);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-hidden pointer-events-none" id="celebration-full-overlay">
          {/* Semi-transparent Backdrop with Blur effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs pointer-events-auto cursor-pointer"
            id="celebration-backdrop"
          />

          {/* Drifting Confetti Particles */}
          <div className="absolute inset-0 select-none overflow-hidden" id="confetti-particles-container">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  x: `${p.x}vw`,
                  y: `${p.y}vh`,
                  rotate: p.rotation,
                  opacity: 1,
                  scale: 0.6,
                }}
                animate={{
                  y: "110vh",
                  x: `${p.x + (Math.sin(p.id) * 15)}vw`, // weave horizontally
                  rotate: p.rotation + (p.id % 2 === 0 ? 360 : -360),
                  opacity: [1, 1, 0.8, 0],
                  scale: [1, 1, 0.8, 0.4],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "linear",
                }}
                className="absolute"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.shape !== "triangle" ? p.color : "transparent",
                  transformOrigin: "center",
                  borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
                  borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
                  borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : undefined,
                  borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "30% 70% 75% 25% / 25% 75% 30% 70%" : "2px",
                }}
              />
            ))}
          </div>

          {/* Celebratory Congratulatory Pop Card Box */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -50 }}
            transition={{ type: "spring", damping: 20, stiffness: 180 }}
            className="relative bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl pointer-events-auto"
            id="celebration-modal-dialog"
          >
            {/* Sparkle background elements */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition cursor-pointer p-1.5 rounded-full hover:bg-slate-800"
              id="close-celebration-btn"
            >
              ✕
            </button>

            {/* Glowing Trophy / Badge Medallion */}
            <div className="flex justify-center mb-5 relative">
              <motion.div
                initial={{ scale: 0.4, rotate: -45 }}
                animate={{ scale: [1.2, 1], rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="relative bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 p-4 rounded-full shadow-lg shadow-amber-500/25 z-10"
              >
                <Award className="w-8 h-8 font-black" />
              </motion.div>
              
              {/* Little halos or orbits */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute inset-0 flex justify-center items-center pointer-events-none"
              >
                <div className="border border-dashed border-amber-500/30 w-18 h-18 rounded-full"></div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] font-bold text-amber-400 bg-amber-400/15 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Weekly Milestone Met</span>
                </motion.span>
                <motion.h4
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-black text-white mt-3.5 tracking-tight"
                >
                  {title}
                </motion.h4>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-slate-300 text-xs px-2.5 leading-relaxed font-medium mt-1.5"
                >
                  {message}
                </motion.p>
              </div>

              {/* Day Streak Upgrade Module */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 to-transparent pointer-events-none"></div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Total Accumulated Streak</span>
                
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], filter: ["drop-shadow(0 0 0px #F59E0B)", "drop-shadow(0 0 12px #F59E0B)", "drop-shadow(0 0 0px #F59E0B)"] }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <Flame className="w-8 h-8 fill-amber-500 text-amber-500" />
                  </motion.div>
                  <motion.span
                    key={visualStreak}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-3xl font-mono font-black text-amber-400 tracking-tighter"
                  >
                    {visualStreak}
                  </motion.span>
                  <span className="text-xl font-bold text-slate-400">Days</span>
                </div>

                {visualStreak < streak && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="absolute right-4 top-4 text-emerald-400 text-xs font-mono font-black"
                  >
                    +1 🔥
                  </motion.span>
                )}
              </motion.div>

              {/* Confirm CTAs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="pt-2"
              >
                <button
                  onClick={onClose}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3 rounded-xl cursor-pointer transition select-none shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98"
                  id="celebrate-ack-button"
                >
                  Awesome, Proceed Jami!
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
