import React, { useState, useRef, useEffect } from "react";
import { BookOpen, CheckSquare, Clock, GraduationCap, AlertTriangle, ArrowRight, Zap, RefreshCw, Flame, Sparkles, Mic, Square, Loader2, Info } from "lucide-react";
import { motion } from "motion/react";
import { Subject, Chapter, Task, QuizResult } from "../types";
import AchievementsShowcase from "./AchievementsShowcase";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from "recharts";

interface DashboardProps {
  userName: string;
  subjects: Subject[];
  chapters: Chapter[];
  tasks: Task[];
  toggleTask: (id: string) => void;
  onAddTask: (title: string, priority: 1|2|3) => void;
  focusMinutes: number;
  weaknessDiagnostic: {
    overallInsight: string;
    weaknesses: { subject: string; accuracy: string; recommendedTopic: string; planOfAction: string }[];
  } | null;
  runningDiagnostic: boolean;
  onRunDiagnostic: () => void;
  weeklyStudyHours: { day: string; hours: number }[];
  streak: number;
  onTriggerTestCelebrate?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 22 }
  }
};

export default function Dashboard({
  userName,
  subjects,
  chapters,
  tasks,
  toggleTask,
  onAddTask,
  focusMinutes,
  weaknessDiagnostic,
  runningDiagnostic,
  onRunDiagnostic,
  weeklyStudyHours,
  streak,
  onTriggerTestCelebrate
}: DashboardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<1|2|3>(2);
  const [rechartsChartType, setRechartsChartType] = useState<"radar" | "pie">("radar");

  // Quick Voice Note State & References
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [transcribedTaskResult, setTranscribedTaskResult] = useState<{ title: string, priority: 1|2|3 } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setTranscribeError(null);
    setTranscribedTaskResult(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (window.MediaRecorder && typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          mimeType = "audio/aac";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) {
          setTranscribeError("No audio was capturing received.");
          setIsTranscribing(false);
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64DataUrl = reader.result as string;
          const base64Raw = base64DataUrl.split(",")[1];
          await processVoiceNoteTranscription(base64Raw, mimeType);
        };
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 29) { // auto stop at 30 seconds
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Failed to start speech recording:", err);
      setTranscribeError("Permission to record audio was denied or mic not available.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(true);
  };

  const processVoiceNoteTranscription = async (base64Audio: string, mimeType: string) => {
    try {
      const response = await fetch("/api/ai/transcribe-voice-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio, mimeType })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to transcribe audio.");
      }

      const result = await response.json();
      if (result && result.title) {
        onAddTask(result.title, result.priority || 2);
        setTranscribedTaskResult({
          title: result.title,
          priority: result.priority || 2
        });
        
        // Auto feedback: clear state and show brief celebration check, then switch back to text mode after 3 seconds
        setTimeout(() => {
          setTranscribedTaskResult(null);
          setInputMode('text');
        }, 3500);
      } else {
        throw new Error("Transcribe succeeded but result didn't contain task title.");
      }
    } catch (err: any) {
      console.error("Transcription execution error:", err);
      setTranscribeError(err.message || "An error occurred during AI transcription.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Calculate dynamic metrics
  const totalChapters = chapters.length;
  const completedChaptersCount = chapters.filter(c => c.status === "completed").length;
  const syllabusDonePercent = totalChapters > 0 ? Math.round((completedChaptersCount / totalChapters) * 100) : 0;

  const totalStudyHoursFormatted = (focusMinutes / 60).toFixed(1) + "h";
  const tasksCompletedCount = tasks.filter(t => t.completed).length;
  const totalTasksCount = tasks.length;

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), newTaskPriority);
    setNewTaskTitle("");
  };

  // SVG Chart Computations: Subject Distribution
  // Let's compute subject distribution based on completion hours or count of chapters
  const subjectDistribution = subjects.map(sub => {
    const subChapters = chapters.filter(c => c.subjectId === sub.id);
    const completedCount = subChapters.filter(c => c.status === "completed").length;
    // Base weight on number of chapters or completed chapters
    const weight = subChapters.length * 3 + completedCount * 5 || 5; 
    return { name: sub.name, value: weight, color: sub.color };
  });

  const totalWeight = subjectDistribution.reduce((acc, curr) => acc + curr.value, 0) || 1;
  
  // Calculate polar coordinates for SVG Pie/Donut Chart slices
  let cumulativePercent = 0;
  const donutSlices = subjectDistribution.map(item => {
    const percent = item.value / totalWeight;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    // Convert percentage to circle offset for svg dash-array
    const circumference = 2 * Math.PI * 40; // radius 40
    const strokeDash = circumference * percent;
    const strokeOffset = circumference * (1 - startPercent);

    return {
      ...item,
      dash: `${strokeDash} ${circumference - strokeDash}`,
      offset: strokeOffset,
      percent: Math.round(percent * 100)
    };
  });

  // Recharts Computations for Subject Completion Distribution
  const rechartsRadarData = subjects.map(sub => {
    const subChapters = chapters.filter(c => c.subjectId === sub.id);
    const total = subChapters.length;
    const completed = subChapters.filter(c => c.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      subject: sub.name.length > 12 ? sub.name.substring(0, 10) + ".." : sub.name,
      fullName: sub.name,
      completion: percent,
      total,
      completed,
    };
  });

  const rechartsCompletedPieData = subjects.map(sub => {
    const subChapters = chapters.filter(c => c.subjectId === sub.id);
    const completed = subChapters.filter(c => c.status === "completed").length;
    return {
      name: sub.name.length > 15 ? sub.name.substring(0, 12) + ".." : sub.name,
      fullName: sub.name,
      value: completed,
      color: sub.color || "#4F46E5",
      total: subChapters.length
    };
  }).filter(item => item.value > 0);

  const hasAnyCompletedChapters = rechartsCompletedPieData.length > 0;

  // Fallback pie data using total chapters structure so card is never empty
  const rechartsFallbackPieData = subjects.map(sub => {
    const subChapters = chapters.filter(c => c.subjectId === sub.id);
    return {
      name: sub.name.length > 15 ? sub.name.substring(0, 12) + ".." : sub.name,
      fullName: sub.name,
      value: subChapters.length || 1,
      color: sub.color || "#4F46E5",
      total: subChapters.length
    };
  });

  const rechartsPieData = hasAnyCompletedChapters ? rechartsCompletedPieData : rechartsFallbackPieData;

  // Pick Next Session advice
  const nextUpChapter = chapters.find(c => c.status === "in_progress") || chapters.find(c => c.status === "not_started");
  const nextUpSubject = nextUpChapter ? subjects.find(s => s.id === nextUpChapter.subjectId) : null;

  return (
    <div className="space-y-6" id="dashboard-tab-view">
      {/* Bento Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-slate-200 pb-6 mb-6 gap-4" id="bento-dashboard-header">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Good Morning, {userName}!</h2>
          <p className="text-slate-500 font-semibold text-xs mt-1">
            Today's focus: <span className="text-indigo-600 font-extrabold">{nextUpChapter ? nextUpChapter.title : "Review and spacing routine"}</span>
          </p>
        </div>
        <div className="flex space-x-4">
          <div className="text-left sm:text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Focus Level</p>
            <p className="text-sm font-black text-indigo-600 mt-1">High Energy Zone</p>
          </div>
        </div>
      </header>

      {/* Progress Cards Bento Row */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <motion.div 
          variants={itemVariants}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Focus Time</span>
            <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">{totalStudyHoursFormatted}</span>
            <span className="block text-[9px] text-slate-500 mt-0.5">Calculated from Pomodoro tasks</span>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Goals completed today</span>
            <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">{tasksCompletedCount}/{totalTasksCount}</span>
            <span className="block text-[9px] text-slate-500 mt-0.5">{totalTasksCount - tasksCompletedCount} priorities remaining</span>
          </div>
        </motion.div>

        {/* Dynamic & Celebratory Streak Display Tile with Interactive Micro-Animations */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -4 }}
          onClick={() => {
            if (onTriggerTestCelebrate) {
              onTriggerTestCelebrate();
            }
          }}
          className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition hover:shadow-md cursor-pointer group relative overflow-hidden"
          title="Click to trigger milestone celebration!"
          id="dashboard-streak-bento-tile"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none -mr-4 -mt-4"></div>
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xs relative">
            <motion.div
              animate={{ 
                scale: [1, 1.12, 1],
                filter: ["drop-shadow(0 0 0px #F59E0B)", "drop-shadow(0 0 6px #F59E0B)", "drop-shadow(0 0 0px #F59E0B)"]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Flame className="w-6 h-6 fill-amber-300 text-amber-100" />
            </motion.div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider block">Daily Active Streak</span>
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, repeatDelay: 3 }}
                className="text-xs"
              >
                🔥
              </motion.span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">{streak} Days</span>
              {streak > 0 && <span className="text-[10px] text-emerald-600 font-extrabold font-mono ml-1.5">LIVE</span>}
            </div>
            <span className="block text-[9px] text-amber-700 font-semibold group-hover:text-indigo-600 transition duration-150">
              Tap to test celebration ✨
            </span>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200"
        >
          <div className="p-3 bg-indigo-600 text-white rounded-2xl">
            <GraduationCap className="w-6 h-6 animate-bounce" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block">Current syllabus completed</span>
            <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">{syllabusDonePercent}%</span>
            <span className="block text-[9px] text-slate-500 mt-0.5 truncate max-w-[170px]">
              {nextUpChapter ? nextUpChapter.title : "All completed!"}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Dynamic Milestones & Achievements Grid */}
      <AchievementsShowcase
        streak={streak}
        focusMinutes={focusMinutes}
        chapters={chapters}
        tasks={tasks}
        hasDiagnostic={!!weaknessDiagnostic}
        onTriggerTestCelebrate={onTriggerTestCelebrate}
      />

      {/* Charts & Interactive Statistics Bento Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Study Time Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="study-hours-chart-panel">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">Academic Study Hours Pacing</h3>
              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-500">WEEKLY VIEW</span>
            </div>
            <p className="text-slate-400 text-xs mb-6">Daily focus duration accumulated over the current calendar week</p>
          </div>

          <div className="relative h-44 w-full flex items-end justify-between px-2 pt-4">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-50">
              <div className="border-t border-dashed border-slate-100 w-full"></div>
              <div className="border-t border-dashed border-slate-100 w-full"></div>
              <div className="border-t border-dashed border-slate-100 w-full"></div>
              <div className="border-t border-dashed border-slate-100 w-full"></div>
            </div>

            {weeklyStudyHours.map((entry) => {
              // max scale is 12h for height percent
              const pct = Math.min(100, (entry.hours / 12) * 100);
              return (
                <div key={entry.day} className="flex flex-col items-center flex-1 group z-10">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip */}
                    <div className="absolute -top-7 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-md transition-all duration-150 font-mono font-bold whitespace-nowrap shadow-md z-30 border border-slate-800">
                      {entry.hours}h focus
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${pct || 4}%` }}
                      className="w-5 bg-indigo-600 rounded-t-lg group-hover:bg-indigo-505 transition-all duration-300 shadow-sm"
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-2.5">{entry.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 pt-3 mt-4">
            <span>Minimum Focus: 4h/day</span>
            <span className="font-extrabold text-slate-600">Goal: 8h Avg</span>
          </div>
        </div>

        {/* SVG Subject Distribution Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="subject-donut-chart-panel">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">Syllabus Subject Allocation</h3>
              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-500">DYNAMIC WEIGHTS</span>
            </div>
            <p className="text-slate-400 text-xs mb-4">Course relative weight calculated dynamically from syllabus completion</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                {donutSlices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="72"
                    cy="72"
                    r="40"
                    className="fill-none transition-all duration-300 stroke-[12px] cursor-pointer hover:stroke-[14px]"
                    style={{
                      stroke: slice.color,
                      strokeDasharray: slice.dash,
                      strokeDashoffset: slice.offset
                    }}
                  />
                ))}
              </svg>
              <div className="text-center z-10 bg-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xs border border-slate-50">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider scale-90">Total</span>
                <span className="text-base font-black text-slate-800 font-mono tracking-tight">{subjects.length}</span>
                <span className="text-[9px] text-slate-500 font-semibold">Subjects</span>
              </div>
            </div>

            {/* Custom Interactive Legend */}
            <div className="flex-1 space-y-2">
              {donutSlices.map((slice, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                    <span className="text-xs text-slate-600 font-bold tracking-tight truncate max-w-[120px]">{slice.name}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-700">{slice.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 mt-4">
            * Completion metric dynamically updates with completed chapter hours.
          </div>
        </div>

        {/* Recharts Subject Completion Distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="recharts-completion-chart-panel">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">Syllabus Completion Index</h3>
              
              {/* Mode Selector Mini Pill */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50" id="recharts-mode-bar">
                <button
                  type="button"
                  onClick={() => setRechartsChartType("radar")}
                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md transition duration-150 cursor-pointer ${rechartsChartType === 'radar' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  🕸️ Radar
                </button>
                <button
                  type="button"
                  onClick={() => setRechartsChartType("pie")}
                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md transition duration-150 cursor-pointer ${rechartsChartType === 'pie' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  🥧 Pie
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              {rechartsChartType === 'radar' 
                ? "Syllabus chapter progress mapped radially per subject"
                : !hasAnyCompletedChapters 
                  ? "Allocation ratio (no chapters have been marked completed yet)"
                  : "Relative ratio of all currently completed chapters"}
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              {rechartsChartType === "radar" ? (
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={rechartsRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: "#94a3b8", fontSize: 8 }}
                    axisLine={false}
                  />
                  <Radar 
                    name="Mastery" 
                    dataKey="completion" 
                    stroke="#6366f1" 
                    fill="#818cf8" 
                    fillOpacity={0.35} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "none", 
                      color: "#ffffff",
                      fontSize: "10px" 
                    }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value}% (${props.payload.completed}/${props.payload.total} chapters)`,
                      "Completion Rate"
                    ]}
                    labelFormatter={(label) => `Subject: ${label}`}
                  />
                </RadarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={rechartsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {rechartsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      borderRadius: "12px", 
                      border: "none", 
                      color: "#ffffff",
                      fontSize: "10px" 
                    }}
                    formatter={(value: any, name: string, props: any) => [
                      hasAnyCompletedChapters 
                        ? `${value} completed chapters (${Math.round((value / chapters.filter(c => c.status === "completed").length) * 100)}%)`
                        : `${value} total chapters`,
                      props.payload.fullName
                    ]}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Footer / Info Indicators */}
          {rechartsChartType === 'pie' ? (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 shrink-0">
              {rechartsPieData.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[10px] text-slate-500 font-bold max-w-[80px] truncate">{item.name}</span>
                </div>
              ))}
              {rechartsPieData.length > 3 && (
                <span className="text-[10px] text-slate-400 font-bold">+{rechartsPieData.length - 3} more</span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 text-center shrink-0 border-t border-slate-200 pt-2.5 mt-2">
              🎯 Focus on lowest vertices to bolster academic parity!
            </div>
          )}
        </div>
      </div>

      {/* Tasks Queue & Weakness Detector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Morning Checklist / Task Generator */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-7 flex flex-col justify-between" id="morning-priority-checklist">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Smart Daily Priorities</h3>
                <p className="text-slate-400 text-xs">Set and track daily focus tasks to keep syllabus on target</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold font-mono text-[10px] px-2.5 py-1 rounded-full sm:order-2">
                  {tasksCompletedCount}/{totalTasksCount} Completed
                </span>
                
                {/* Input Mode Selector */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 sm:order-1" id="task-entry-mode-bar">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('text');
                      setTranscribeError(null);
                      setTranscribedTaskResult(null);
                    }}
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md transition duration-150 cursor-pointer ${inputMode === 'text' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    ⌨️ Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('voice');
                      setTranscribeError(null);
                      setTranscribedTaskResult(null);
                    }}
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md transition duration-150 flex items-center gap-0.5 cursor-pointer ${inputMode === 'voice' ? 'bg-indigo-600 text-white shadow-xs animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
                  >
                    🎙️ Voice Note
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active priorities. Add one below to pace out your day.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer rounded-2xl transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}} // dynamic parent updates
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-xs font-semibold ${
                        task.completed ? "line-through text-slate-400" : "text-slate-700"
                      }`}>
                        {task.title}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                        task.priority === 1
                          ? "bg-red-50 border border-red-200 text-red-700"
                          : task.priority === 2
                            ? "bg-amber-50 border border-amber-250 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}>
                        {task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {inputMode === 'text' ? (
            <form onSubmit={handleAddNewTask} className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4" id="task-addition-form">
              <input
                type="text"
                id="new-task-title-input"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add next study priority topic..."
                className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/20"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(Number(e.target.value) as 1|2|3)}
                className="text-xs px-2.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white"
              >
                <option value="1">High</option>
                <option value="2">Medium</option>
                <option value="3">Low</option>
              </select>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition shadow-xs cursor-pointer shrink-0"
              >
                Add
              </button>
            </form>
          ) : (
            <div className="mt-4 border-t border-slate-200 pt-4 flex flex-col gap-3" id="voice-entry-recorder-shelf">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>AI Voice Note Task Extractor</span>
                </span>
                
                {isRecording && (
                  <span className="text-[9px] bg-red-100 border border-red-200 text-red-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                     Recording: {recordingDuration}s / 30s
                  </span>
                )}
                {isTranscribing && (
                  <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-600" />
                    <span>Transcribing with Gemini...</span>
                  </span>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {transcribeError ? (
                    <div className="text-xs font-semibold text-red-600 leading-snug flex items-center gap-1.5 p-1 bg-red-50/50 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{transcribeError}</span>
                    </div>
                  ) : transcribedTaskResult ? (
                    <div className="text-xs text-emerald-800 leading-snug flex items-start gap-1.5 p-2 bg-emerald-50/55 rounded-2xl border border-emerald-200">
                      <span className="text-base">✨</span>
                      <div>
                        <p className="font-extrabold text-[10px] uppercase text-emerald-700 tracking-wider">Deduced and Added to Daily Priorities!</p>
                        <p className="font-bold text-slate-800 mt-1">"{transcribedTaskResult.title}"</p>
                        <p className="text-[9px] font-semibold text-slate-500 mt-1">
                          Priority Duality: {transcribedTaskResult.priority === 1 ? "🔴 High" : transcribedTaskResult.priority === 2 ? "🟡 Medium" : "🟢 Low"}
                        </p>
                      </div>
                    </div>
                  ) : isTranscribing ? (
                    <p className="text-xs text-slate-500 font-semibold italic animate-pulse">
                      Analyzing speech structures and planning task priority...
                    </p>
                  ) : isRecording ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-850 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                        <span className="text-red-700">Listening to your instructions...</span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold">Say something like: "Clean up organic chemistry formulas, priority high, deadline tomorrow"</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Tap microphone, speak your goal clearly, and we'll extract the task title and priority automatically!
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end shrink-0">
                  {!isRecording && !isTranscribing ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-12 h-12 bg-indigo-600 hover:bg-indigo-750 active:scale-95 text-white flex items-center justify-center rounded-full shadow-md transition cursor-pointer relative group border border-indigo-700"
                      title="Start recording"
                      id="voice-record-btn-start"
                    >
                      <div className="absolute inset-0 bg-indigo-500 rounded-full scale-100 group-hover:scale-110 opacity-20 transition duration-300"></div>
                      <Mic className="w-5 h-5 z-10" />
                    </button>
                  ) : isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-12 h-12 bg-red-500 hover:bg-red-650 active:scale-95 text-white flex items-center justify-center rounded-full shadow-md transition cursor-pointer relative animate-pulse border border-red-600"
                      title="Stop and Transcribe"
                      id="voice-record-btn-stop"
                    >
                      <Square className="w-4 h-4 fill-white text-white" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-12 h-12 bg-indigo-100 text-indigo-450 flex items-center justify-center rounded-full border border-indigo-200 cursor-not-allowed"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Weakness Detector Bento Widget (Warm Orange alerts theme) */}
        <div className="bg-orange-50/80 border border-orange-200 rounded-3xl p-6 shadow-sm lg:col-span-5 flex flex-col justify-between" id="ai-weakness-widget">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-bold text-orange-950 text-sm tracking-tight uppercase">Weakness Alert</h3>
              </div>
              <button
                onClick={onRunDiagnostic}
                disabled={runningDiagnostic}
                className="text-[10px] bg-white hover:bg-orange-100/50 disabled:opacity-50 border border-orange-200 text-orange-900 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition font-bold"
              >
                <RefreshCw className={`w-3 h-3 ${runningDiagnostic ? "animate-spin" : ""}`} />
                <span>Diagnostic Test</span>
              </button>
            </div>
            <p className="text-orange-800 text-xs mb-4 leading-relaxed font-semibold">Evaluates syllabus completion and test scores to guide correction target priorities</p>

            {runningDiagnostic ? (
              <div className="py-8 text-center">
                <div className="animate-pulse flex flex-col items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border-2 border-orange-600 border-t-transparent animate-spin"></div>
                  <span className="text-xs text-orange-900 font-extrabold">Analyzing study diagnostics...</span>
                </div>
              </div>
            ) : weaknessDiagnostic ? (
              <div className="space-y-3.5" id="ai-diagnostic-results">
                <div className="p-3.5 bg-orange-100/40 text-orange-900 rounded-2xl text-[11px] leading-relaxed font-bold border border-orange-200/50">
                  ⚠️ {weaknessDiagnostic.overallInsight}
                </div>
                {weaknessDiagnostic.weaknesses.map((item, idx) => (
                  <div key={idx} className="p-3.5 border border-orange-200 bg-white rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 font-mono">{item.subject}</span>
                      <span className="text-[9px] bg-red-150 text-red-700 px-2 py-0.5 rounded-full font-black uppercase">
                        {item.accuracy} Accuracy
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">Recommended: <span className="text-indigo-600 font-black">{item.recommendedTopic}</span></p>
                    <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 p-2 rounded-xl leading-relaxed">
                      <strong>Plan of Action:</strong> {item.planOfAction}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 bg-white/50 rounded-2xl border border-dashed border-orange-200 text-center flex flex-col items-center justify-center gap-2">
                <GraduationCap className="w-8 h-8 text-orange-300" />
                <span className="text-xs text-orange-800 font-semibold">No diagnostic run yet</span>
                <button
                  onClick={onRunDiagnostic}
                  className="mt-1 bg-white hover:bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Analyze Study Data
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-orange-100 text-xs text-orange-950 font-semibold leading-snug flex items-center gap-2 mt-4 shadow-2xs">
            <Zap className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Spaced reinforcement logs have updated in style.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
