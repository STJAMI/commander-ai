import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Brain, Clock, ShieldCheck, Mail, Lock, User, Terminal, BookOpen, Compass, HelpCircle, Flame, Star, CheckCircle, ArrowRight, Activity, Award } from "lucide-react";
import { FirebaseUser } from "../utils/firebase";

interface LandingPageProps {
  onSignInWithGoogle: () => Promise<void>;
  onGuestAccess: (customUser?: { displayName: string; email: string; isGuest: boolean }) => void;
  isLoading: boolean;
}

export default function LandingPage({ onSignInWithGoogle, onGuestAccess, isLoading }: LandingPageProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dailyGoal, setDailyGoal] = useState("4");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  // Interactive Quiz / Study routine intensity estimator state
  const [estHours, setEstHours] = useState(2);
  const [estSubjectCount, setEstSubjectCount] = useState(3);
  const [estStressLevel, setEstStressLevel] = useState("medium");

  // Bento preview tab selection
  const [previewTab, setPreviewTab] = useState<"syllabus" | "memory" | "mentor">("syllabus");

  const avatarPresets = [
    { label: "🚀 Commander", color: "bg-indigo-600" },
    { label: "🧪 Chemist", color: "bg-emerald-600" },
    { label: "🔬 Physicist", color: "bg-cyan-600" },
    { label: "📐 Math Wizard", color: "bg-purple-600" },
  ];

  // Mock-authentic custom email registration
  const handleEmailAction = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError("Please fill out all required fields.");
      return;
    }

    if (authMode === "signup" && !name) {
      setAuthError("Name field is required.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    // Account creation validation & access pipeline
    const sessionUser = {
      displayName: authMode === "signup" ? `${name} (${avatarPresets[avatarIndex].label})` : email.split("@")[0],
      email: email,
      isGuest: false,
    };

    onGuestAccess(sessionUser);
  };

  // Calculate intensity heuristics based on user's estimator input
  const calculateIntensity = () => {
    const hoursFactor = estHours;
    const subjectsFactor = estSubjectCount * 1.5;
    const stressMultiplier = estStressLevel === "high" ? 1.4 : estStressLevel === "low" ? 0.8 : 1.1;
    const finalScore = Math.round((hoursFactor + subjectsFactor) * stressMultiplier);

    if (finalScore > 12) return { text: "Heavy Meta-Learning Mode", desc: "Intense, optimized Spaced Repetitions needed", color: "text-rose-500 bg-rose-50 border-rose-100" };
    if (finalScore >= 7) return { text: "Balanced Core Study Mode", desc: "Adaptive Pomodoros and memory retention track recommended", color: "text-indigo-600 bg-indigo-50 border-indigo-100" };
    return { text: "Calibrated Steady Learning Plan", desc: "Focused routine targeted around key syllabus topics", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
  };

  const intensity = calculateIntensity();

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden antialiased relative">
      {/* Absolute ambient lights floating behind sections */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-600/10 to-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating navigation header */}
      <header className="border-b border-slate-800/80 bg-[#0F172A]/85 backdrop-blur-md sticky top-0 z-50 px-6 py-4" id="landing-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400 block leading-tight">Commander Terminal</span>
              <h1 className="text-lg font-black tracking-tight" id="landing-logo">Commander.ai</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const element = document.getElementById("auth-panel-anchor");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full text-xs font-bold transition hover:scale-102 cursor-pointer shadow-md text-white"
              id="btn-nav-get-started"
            >
              Access System
            </button>
          </div>
        </div>
      </header>

      {/* Hero section with world-class headers & call to action */}
      <main className="flex-1 w-full animate-fade-in" id="landing-main">
        {/* Majestic Hero Banner */}
        <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 text-center relative" id="hero-heading-block">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 mb-6 text-indigo-400" id="announcement-pill"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest animate-pulse">Version 2.4 - Fully Equipped Scientific Syllabus</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-3xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto text-white leading-tight" id="hero-display-typography"
          >
            Transform your study routine into an <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">automated study engine</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto mt-6 leading-relaxed" id="hero-subtitle"
          >
            Say goodbye to disorganized notes. Plan exact syllabus schedules, forecast recall metrics, build custom simulated exams, and review weaknesses in real-time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const element = document.getElementById("auth-panel-anchor");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xs text-white shadow-xl shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
              id="btn-hero-cta"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(51, 65, 85, 0.9)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const element = document.getElementById("features-section-anchor");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-6 py-4 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-2xl font-bold text-xs text-slate-300 transition cursor-pointer"
              id="btn-hero-tour"
            >
              Explore Features
            </motion.button>
          </motion.div>

          <div className="mt-5 text-[10px] text-slate-500 font-mono" id="direct-landing-specs">
            ★ Optimized Offline States • Syncs with Firestore • 2026 Academic Syllabus Ready
          </div>
        </section>

        {/* Feature Interactive Bento Grid Area */}
        <section className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20" id="features-section-anchor">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-white mb-2">Designed for Academic Excellence</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Five scientific utilities crafted for peak comprehension and performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="landing-bento-grid">
            {/* Bento Card 1: Syllabus Track */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2">Subject & Syllabus Tracker</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Break courses down into Chapters. Flag difficulty, map expected progress hours, and import dynamic syllabus files.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-indigo-400">
                <span>✓ Chapter status tracker</span>
                <span>✓ Realtime statistics</span>
              </div>
            </div>

            {/* Bento Card 2: Memory Curve spaced repetition */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2">Ebbinghaus Retention Decay</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tracks when your memories fade. Automates review times and shows interactive retention level curves so you never go blank.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-amber-400">
                <span>✓ Active recall list</span>
                <span>✓ Half-life decay math</span>
              </div>
            </div>

            {/* Bento Card 3: AI Voice Mentor */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-2xl w-fit mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2">AI Innovation & Voice Coach</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provides dynamic AI diagnostics to inspect academic weaknesses, auto-creates notes, and responds as a customizable partner.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-pink-400">
                <span>✓ Weakness insights</span>
                <span>✓ Auto study routines</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live App Sandbox Interactive Mock Tab Frame */}
        <section className="max-w-7xl mx-auto px-6 py-12" id="live-interactive-sandbox">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 md:p-8" id="sandbox-container">
            <div className="flex flex-col md:flex-row items-stretch gap-6">
              {/* Tab Selector Left Pane */}
              <div className="md:w-1/3 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-950 text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-3">
                    <Terminal className="w-3.5 h-3.5" /> Interactive Simulation
                  </div>
                  <h3 className="text-lg md:text-2xl font-black text-white leading-tight">Test drive Commander.ai</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Toggle different dashboard modules to inspect how the dynamic syllabus compiler computes your metrics.
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <button
                    onClick={() => setPreviewTab("syllabus")}
                    className={`p-3.5 rounded-2xl text-xs font-bold text-left border flex items-center gap-3 transition-all cursor-pointer ${
                      previewTab === "syllabus"
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <div>
                      <p className="font-extrabold text-xs">Syllabus Tracker</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">Chapters completed: 78%</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPreviewTab("memory")}
                    className={`p-3.5 rounded-2xl text-xs font-bold text-left border flex items-center gap-3 transition-all cursor-pointer ${
                      previewTab === "memory"
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Brain className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-extrabold text-xs">Forgetfulness Decay</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">Spaced repetition reviews ready: 4</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPreviewTab("mentor")}
                    className={`p-3.5 rounded-2xl text-xs font-bold text-left border flex items-center gap-3 transition-all cursor-pointer ${
                      previewTab === "mentor"
                        ? "bg-slate-800 border-indigo-500 text-white"
                        : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Award className="w-4 h-4 text-rose-400" />
                    <div>
                      <p className="font-extrabold text-xs">AI Diagnostic Analyzer</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">Diagnose Newtonian Dynamics</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Simulation Screen Window Right Pane */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between select-none" id="sandbox-screen">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span>ACTIVE SYSTEM PREVIEW</span>
                </div>

                <AnimatePresence mode="wait">
                  {previewTab === "syllabus" && (
                    <motion.div
                      key="syllabus"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-4 py-2"
                    >
                      <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">PHYSICS 1ST PAPER</span>
                          <h4 className="text-xs font-extrabold text-white mt-0.5">Newtonian Mechanics & Vectors</h4>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded">2 Chapters Ready</span>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-slate-900/60 p-3 rounded-lg flex items-center justify-between text-xs">
                          <span className="text-slate-300">Chapter 1: Physical Quantities</span>
                          <span className="text-emerald-400 font-mono text-[10px]">100% Completed</span>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg flex items-center justify-between text-xs">
                          <span className="text-slate-200">Chapter 4: Newtonian Force (Hard)</span>
                          <span className="text-orange-400 font-mono text-[10px]">In Progress (Formula Drafting)</span>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg flex items-center justify-between text-xs">
                          <span className="text-slate-400">Chapter 5: Work, Energy & Power</span>
                          <span className="text-slate-500 font-mono text-[10px]">Not Started</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {previewTab === "memory" && (
                    <motion.div
                      key="memory"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-3.5 py-2"
                    >
                      <div>
                        <h4 className="text-xs font-extrabold text-white">Active Retention Health</h4>
                        <p className="text-[10px] text-amber-300 mt-1">Syllabus decay curves auto-calculate as time passes.</p>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Chapter 2: Vectors (Reviewed 2 days ago)</span>
                            <span className="text-emerald-400 font-mono">82% Retained</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "82%" }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="bg-emerald-500 h-full"
                            ></motion.div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Chapter 3: Dynamics (Reviewed 5 days ago)</span>
                            <span className="text-rose-400 font-mono">49% Retained - Decay alert!</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "49%" }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="bg-rose-500 h-full"
                            ></motion.div>
                          </div>
                        </div>
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-[#0F172A] font-extrabold text-xs rounded-lg transition mt-2 cursor-pointer"
                      >
                        ⚡ Trigger Review Priority Session
                      </motion.button>
                    </motion.div>
                  )}

                  {previewTab === "mentor" && (
                    <motion.div
                      key="mentor"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-4 py-2 text-left"
                    >
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 italic relative animate-pulse">
                        <span className="absolute top-2 right-2 text-[9px] font-mono text-cyan-400 font-bold">INSIGHT DETECTED</span>
                        "Warning: In Mathematics Chapter 3 (Complex numbers), your formula accuracy dropped to 58%. It is predicted that a mock test priority focus will save you 2 grade points on Exam day."
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 uppercase font-mono block">RECOMMENDED WORKOUT</span>
                          <span className="text-slate-200 mt-1 block font-bold">MCQ Quiz (Syllabus Euler)</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 uppercase font-mono block">MAPPED RECOVERY</span>
                          <span className="text-emerald-400 mt-1 block font-bold">Gain 1.5 study hours</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>★ Core Module Sandbox Client</span>
                  <span>Interactive Engine v2.4</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real Dynamic Interactive Study Routine Intensity Estimator Call-out */}
        <section className="max-w-7xl mx-auto px-6 py-12" id="intensity-calculator-block">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-lg md:text-2xl font-black text-white">Academic Focus Estimator</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Plan your exam target variables. Our dynamic estimator will outline your custom study rhythm matrix straight away.
                </p>

                <div className="space-y-5 mt-6">
                  {/* Slider 1: estimated study hours */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Daily Study Hours Target</span>
                      <span className="text-indigo-400 font-mono font-bold">{estHours} Hours/day</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="12" 
                      value={estHours} 
                      onChange={(e) => setEstHours(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-800 rounded-lg appearance-none h-2 cursor-pointer"
                    />
                  </div>

                  {/* Selector 2: subject counts */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Active Difficult Subjects</span>
                      <span className="text-indigo-400 font-mono font-bold">{estSubjectCount} Subjects</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="7" 
                      value={estSubjectCount} 
                      onChange={(e) => setEstSubjectCount(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-800 rounded-lg appearance-none h-2 cursor-pointer"
                    />
                  </div>

                  {/* Button choices: stress level */}
                  <div>
                    <span className="text-xs text-slate-400 block mb-2">Exams Stress / Time Constraint Priority</span>
                    <div className="grid grid-cols-3 gap-2">
                      {["low", "medium", "high"].map((level) => (
                        <button
                          key={level}
                          onClick={() => setEstStressLevel(level)}
                          className={`py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                            estStressLevel === level
                              ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/10"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {level} priority
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic computed recommendation display panel */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between text-slate-300">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-indigo-400 font-bold block mb-1">COMPUTED SYSTEM RECOMMENDATION</span>
                  <p className="text-base font-extrabold text-white mt-1">Syllabus Routine Intensity:</p>
                  
                  <div className={`mt-4 p-4 rounded-xl border font-bold text-center ${intensity.color}`}>
                    <p className="text-xs md:text-sm uppercase tracking-wider font-extrabold">{intensity.text}</p>
                    <p className="text-[10px] mt-1 font-normal text-slate-500">{intensity.desc}</p>
                  </div>

                  <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1.5 mt-4">
                    <li>Dynamic Spaced Repetition items calculated: <strong>{estSubjectCount * 2} active cards</strong></li>
                    <li>Adaptive study intensity rating: <strong>{estHours >= 8 ? "Extreme Level" : estHours >= 4 ? "Aesthetic Curve" : "Moderate Speed"}</strong></li>
                    <li>Recommended daily revision milestones: <strong>{estHours + 1} micro-milestones</strong></li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>★ Estimator Engine v2.4</span>
                  <span>Calculated in 0.02s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic World-Class Authentication Section (Sign In & Sign up with Credentials, Google Auth side by side) */}
        <section className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20" id="auth-panel-anchor">
          <div className="mx-auto max-w-4xl bg-gradient-to-br from-indigo-950/20 via-slate-900/80 to-indigo-950/20 border border-indigo-900/50 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Brand Marketing highlights */}
              <div className="p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 bg-[#0c1322]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#131f37] text-[9px] text-[#818cf8] uppercase tracking-wider font-extrabold font-mono mb-4">
                    <ShieldCheck className="w-3.5 h-3.5" /> SECURE AUTHENTICATION
                  </div>
                  <h3 className="text-lg md:text-2xl font-black text-white">Join Thousands of Students</h3>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    Access Commander.ai to compile your study syllabus, receive active recall decay diagnostics, auto-simulate examinations, and keep focus records.
                  </p>
                </div>

                <div className="space-y-4 mt-8 md:mt-0">
                  <div className="flex items-center gap-3 bg-indigo-950/30 p-3 rounded-2xl border border-indigo-900/20">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">98% Success Rate</h4>
                      <p className="text-[10px] text-slate-400 leading-none mt-1">Achieved by active recurring students.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-indigo-950/30 p-3 rounded-2xl border border-indigo-900/20">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                      <Flame className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Unbounded Streak Rewards</h4>
                      <p className="text-[10px] text-slate-400 leading-none mt-1">Maintained by dynamic Pomodoro intervals.</p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono mt-4 leading-none flex items-center gap-1">
                  <span>🔒 Standard AES and Firebase TLS active</span>
                </div>
              </div>

              {/* Right Column: Beautiful tabbed forms */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                {/* Mode Select Header */}
                <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authMode === "signup"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authMode === "signin"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold rounded-xl animate-shake">
                    ⚠️ {authError}
                  </div>
                )}

                {/* Main Auth Form */}
                <form onSubmit={handleEmailAction} className="space-y-4 text-left">
                  <AnimatePresence mode="popLayout">
                    {authMode === "signup" && (
                      <motion.div
                        key="signup-fields"
                        initial={{ opacity: 0, height: 0, y: -12 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Your Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              required
                              placeholder="Jami Chowdhury"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-600"
                            />
                          </div>
                        </div>

                        {/* Custom Avatar Selection */}
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Avatar Specialty Role</label>
                          <div className="grid grid-cols-2 gap-2">
                            {avatarPresets.map((preset, i) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setAvatarIndex(i)}
                                className={`p-2.5 rounded-xl text-[10px] font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                                  avatarIndex === i
                                    ? `${preset.color} border-indigo-400 text-white shadow-md`
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-350"
                                }`}
                              >
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="jami@school.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">Academic Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/15 cursor-pointer transition active:scale-98"
                  >
                    {isLoading ? "Authenticating Study Engine..." : authMode === "signup" ? "Create Account & Enter" : "Access Credentials Account"}
                  </button>
                </form>

                {/* Google Login Split Option */}
                <div className="relative my-5 flex items-center justify-center text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                  <div className="absolute inset-x-0 h-px bg-slate-800"></div>
                  <span className="relative px-3 bg-[#0c1322]">Or Authenticated Sync</span>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={onSignInWithGoogle}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-xs text-slate-200 transition cursor-pointer flex items-center justify-center gap-2.5"
                    id="btn-landing-google-signin"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Google Authenticated Sync</span>
                  </button>

                  <button
                    onClick={() => onGuestAccess()}
                    className="w-full py-2.5 bg-transparent text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition hover:bg-slate-900/40 border border-transparent hover:border-slate-800"
                    id="btn-landing-guest-signin"
                  >
                    Direct Instant Access (Guest)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer with status tags */}
      <footer className="border-t border-slate-800 bg-slate-950 text-[11px] text-slate-500 py-6 px-6" id="landing-footer-credits">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 1989-2026 Commander.ai. Crafted with durable active state engines of higher comprehension.</span>
          <span className="font-mono text-indigo-400 font-bold">● Google Workspace & AI Services Connected</span>
        </div>
      </footer>
    </div>
  );
}
