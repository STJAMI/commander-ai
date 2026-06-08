import React, { useState } from "react";
import { Award, Flame, Brain, CheckSquare, BookOpen, Sparkles, Trophy, Star, Shield, Zap, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Subject, Chapter, Task } from "../types";

export interface Badge {
  id: string;
  title: string;
  description: string;
  metricLabel: string;
  requirementText: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  isUnlocked: boolean;
  currentProgress: number;
  maxProgress: number;
}

interface AchievementsShowcaseProps {
  streak: number;
  focusMinutes: number;
  chapters: Chapter[];
  tasks: Task[];
  hasDiagnostic: boolean;
  onTriggerTestCelebrate?: () => void;
  variant?: "dashboard" | "compact-header";
}

export default function AchievementsShowcase({
  streak,
  focusMinutes,
  chapters,
  tasks,
  hasDiagnostic,
  onTriggerTestCelebrate,
  variant = "dashboard"
}: AchievementsShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Compute stats
  const completedChaptersCount = chapters.filter(c => c.status === "completed").length;
  const completedTasksCount = tasks.filter(t => t.completed).length;

  // Define Badge list with logical dynamic checks
  const badgesData: Badge[] = [
    {
      id: "early_bird",
      title: "Early Bird Focus",
      description: "Initiated deep study operations inside the automated Pomodoro workspace.",
      metricLabel: "Initial Study Activity",
      requirementText: "Accumulate at least 1 minute of focus time.",
      icon: <Flame className="w-5 h-5" />,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      glowColor: "rgba(245, 158, 11, 0.4)",
      isUnlocked: focusMinutes > 0,
      currentProgress: focusMinutes > 0 ? 1 : 0,
      maxProgress: 1,
    },
    {
      id: "consistency_king",
      title: "Consistency King",
      description: "Maintained consecutive daily workspace milestones to beat memory decay.",
      metricLabel: "Daily Streak",
      requirementText: "Reach a continuous study streak of 3 or more days.",
      icon: <Trophy className="w-5 h-5" />,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      glowColor: "rgba(234, 179, 8, 0.4)",
      isUnlocked: streak >= 3,
      currentProgress: Math.min(streak, 3),
      maxProgress: 3,
    },
    {
      id: "deep_worker",
      title: "Deep Worker Core",
      description: "Sustained high cognitive focus intervals over a full accumulated hour.",
      metricLabel: "Total Focus Time",
      requirementText: "Accumulate 60 or more minutes of total study focus.",
      icon: <Brain className="w-5 h-5" />,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      glowColor: "rgba(99, 102, 241, 0.4)",
      isUnlocked: focusMinutes >= 60,
      currentProgress: Math.min(focusMinutes, 60),
      maxProgress: 60,
    },
    {
      id: "syllabus_pioneer",
      title: "Syllabus Pioneer",
      description: "Fully mastered and checked off your first course syllabus chapter.",
      metricLabel: "Chapters Completed",
      requirementText: "Complete at least 1 academic chapter.",
      icon: <BookOpen className="w-5 h-5" />,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      glowColor: "rgba(16, 185, 129, 0.4)",
      isUnlocked: completedChaptersCount >= 1,
      currentProgress: Math.min(completedChaptersCount, 1),
      maxProgress: 1,
    },
    {
      id: "priority_annihilator",
      title: "Priority Annihilator",
      description: "Cleared scheduled daily target tasks and planner milestones.",
      metricLabel: "Planner Tasks Done",
      requirementText: "Complete 3 or more total tasks in your study planner.",
      icon: <CheckSquare className="w-5 h-5" />,
      iconColor: "text-pink-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20",
      glowColor: "rgba(236, 72, 153, 0.4)",
      isUnlocked: completedTasksCount >= 3,
      currentProgress: Math.min(completedTasksCount, 3),
      maxProgress: 3,
    },
    {
      id: "ai_inquisitor",
      title: "AI Inquisitor",
      description: "Triggered active AI-driven feedback loops to diagnose syllabus weaknesses.",
      metricLabel: "Lab Diagnostics",
      requirementText: "Run the AI weakness diagnostics test in the dynamic lab widget.",
      icon: <Sparkles className="w-5 h-5" />,
      iconColor: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      glowColor: "rgba(6, 182, 212, 0.4)",
      isUnlocked: hasDiagnostic,
      currentProgress: hasDiagnostic ? 1 : 0,
      maxProgress: 1,
    }
  ];

  const unlockedBadges = badgesData.filter(b => b.isUnlocked);
  const totalBadgesCount = badgesData.length;
  const unlockedBadgesCount = unlockedBadges.length;
  const unlockPercent = Math.round((unlockedBadgesCount / totalBadgesCount) * 100);

  // Render option 1: Small header visual tracker
  if (variant === "compact-header") {
    return (
      <div className="flex items-center gap-1.5" id="compact-header-badges-view">
        <div className="flex -space-x-1">
          {badgesData.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-white cursor-pointer transition hover:scale-115 hover:z-20 ${
                badge.isUnlocked ? "bg-slate-900 border-indigo-400" : "bg-slate-200 border-slate-300 opacity-40 grayscale"
              }`}
              title={`${badge.title}: ${badge.isUnlocked ? "Unlocked! 🎉" : "Locked (Click to see requirement)"}`}
              id={`header-badge-circle-${badge.id}`}
            >
              <span className={`scale-75 ${badge.isUnlocked ? badge.iconColor : 'text-slate-400'}`}>
                {badge.icon}
              </span>
            </div>
          ))}
        </div>
        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full shadow-3xs" id="header-unlocked-score">
          {unlockedBadgesCount}/{totalBadgesCount} Badges
        </span>

        {/* Floating details overlay for interactive badge popup */}
        <AnimatePresence>
          {selectedBadge && renderBadgeDetailModal(selectedBadge, () => setSelectedBadge(null))}
        </AnimatePresence>
      </div>
    );
  }

  // Helper render for modal detail view
  function renderBadgeDetailModal(badge: Badge, onClose: () => void) {
    const pct = Math.round((badge.currentProgress / badge.maxProgress) * 100);
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm pointer-events-auto"
        id="badge-detail-modal-overlay"
        onClick={onClose}
      >
        <div 
          className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-800"
          id="badge-detail-card"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            aria-label="Close details"
            id="btn-close-badge-modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            {/* Visual Icon with custom back glow based on unlock state */}
            <div 
              style={{ 
                boxShadow: badge.isUnlocked ? `0 10px 25px -5px ${badge.glowColor}` : 'none' 
              }}
              className={`p-5 rounded-full border-2 scale-110 mb-4 flex items-center justify-center transition-all ${
                badge.isUnlocked 
                  ? `${badge.bgColor} ${badge.borderColor} ${badge.iconColor} border-opacity-65` 
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
              id="detail-badge-icon"
            >
              <div className="scale-125">
                {badge.icon}
              </div>
            </div>

            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
              badge.isUnlocked 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-slate-50 text-slate-400 border-slate-100"
            }`}>
              {badge.isUnlocked ? "✨ SYSTEM UNLOCKED" : "🔒 MODULE CALIBRATING"}
            </span>

            <h3 className="text-lg font-black text-slate-900 mt-3 leading-tight">
              {badge.title}
            </h3>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {badge.description}
            </p>

            {/* Achievement progression stats bar */}
            <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl mt-5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>{badge.metricLabel} Target</span>
                <span className="text-slate-600 font-mono">
                  {badge.currentProgress} / {badge.maxProgress}
                </span>
              </div>
              
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    badge.isUnlocked ? "bg-indigo-600" : "bg-slate-400 animate-pulse"
                  }`}
                ></div>
              </div>

              <p className="text-[11px] text-slate-500 text-left pt-1 leading-normal">
                <strong>How to complete:</strong> {badge.requirementText}
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              id="badge-detail-modal-action-btn"
            >
              Got it, keep going!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render option 2: Dashboard central visual section (Bento widget style)
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="achievements-dashboard-block">
      <div>
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Academic Milestone Badges</h3>
          </div>
          <span className="text-[10px] font-black bg-indigo-50 border border-indigo-200 text-indigo-600 px-2.5 py-0.5 rounded-full font-mono">
            {unlockedBadgesCount}/{totalBadgesCount} UNLOCKED
          </span>
        </div>
        <p className="text-slate-400 text-xs mb-5">Unlock real-time profile badges by advancing your streak calendar and deep work durations</p>

        {/* Global Progress visual track */}
        <div className="mb-6 space-y-1.5" id="achievements-global-meter">
          <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
            <span>Overall Completeness</span>
            <span className="font-mono">{unlockPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
            <div 
              style={{ width: `${unlockPercent}%` }} 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            ></div>
          </div>
        </div>

        {/* Responsive grid of badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5" id="dashboard-badges-list-box">
          {badgesData.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-3.5 rounded-2xl border transition duration-200 text-center flex flex-col items-center justify-between cursor-pointer ${
                badge.isUnlocked
                  ? "bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                  : "bg-slate-50/40 border-slate-100 opacity-60 hover:opacity-80"
              }`}
              id={`dashboard-badge-card-${badge.id}`}
              title={`Click to inspect ${badge.title}`}
            >
              <div className="flex flex-col items-center">
                {/* Micro badge icon container */}
                <div className={`p-2.5 rounded-xl border mb-2 flex items-center justify-center ${
                  badge.isUnlocked 
                    ? `${badge.bgColor} ${badge.borderColor} ${badge.iconColor}` 
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}>
                  {badge.icon}
                </div>
                <h4 className={`text-xs font-extrabold tracking-tight ${badge.isUnlocked ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                  {badge.title}
                </h4>
              </div>

              <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                {badge.isUnlocked ? "✓ Unlocked" : "Locked"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-200 mt-5 flex items-center gap-1">
        <span>💡 Tap on any badge to inspect its dynamic milestones, current progress stats, or criteria.</span>
      </div>

      {/* Detail overlay */}
      <AnimatePresence>
        {selectedBadge && renderBadgeDetailModal(selectedBadge, () => setSelectedBadge(null))}
      </AnimatePresence>
    </div>
  );
}
