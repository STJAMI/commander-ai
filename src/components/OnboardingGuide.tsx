import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronRight, ChevronLeft, Sparkles, X, Brain, Target, Star } from "lucide-react";

interface OnboardingGuideProps {
  onDismiss: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function OnboardingGuide({ onDismiss, activeTab, setActiveTab }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Commander.ai! 🚀",
      description: "Let's take a 60-second tour of your world-class medical and academic study console to get your courses organized.",
      targetId: "header-app-logo",
      tab: "dashboard",
      tip: "You can open or bypass this interactive manual anytime."
    },
    {
      title: "Workspace Hub Navigator 🗂️",
      description: "Use this sidebar rail to pivot easily between syllabus trackers, study planners, Spaced Memory curve metrics, and dynamic Exam Simulators.",
      targetId: "nav-tabs-rail",
      tab: "dashboard",
      tip: "Each module is packed with automated algorithms."
    },
    {
      title: "Color Theme Aesthetics 🎨",
      description: "Match your mental state with professional workspace colors: Classic Slate, Cosmic Dark, Sunset Clay, or Cyber Neon.",
      targetId: "theme-selector-bubble",
      tab: "dashboard",
      tip: "Select Classic Slate for clean daytime focus, or Cosmic Dark for night revisions."
    },
    {
      title: "Exam Target & Streaks 🔥",
      description: "This tile estimates days remaining till main exams. Keeping streaks active automates your memory decay levels and expands your stats.",
      targetId: "app-sidebar-nav-container",
      tab: "dashboard",
      tip: "Try reviewing tasks to elevate focus streaks automatically."
    },
    {
      title: "Weakness AI Diagnostics 🧠",
      description: "Toggle any smart module inside the Innovation Lab. The AI engine auto-detects and extracts weaknesses from your quiz logs in one click.",
      targetId: "active-tab-content-panel",
      tab: "dashboard",
      tip: "Run diagnoses routinely to clear syllabus doubts."
    }
  ];

  const current = steps[step];

  // Auto-align active tab based on tour step preferences for context focus
  useEffect(() => {
    if (current?.tab && activeTab !== current.tab) {
      setActiveTab(current.tab);
    }
  }, [step]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onDismiss();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" id="onboarding-guide-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative text-slate-800"
        id={`onboarding-step-${step}`}
      >
        {/* Dynamic decorative absolute elements */}
        <div className="absolute -top-3 -right-3 p-2 bg-indigo-600 text-white rounded-full shadow-md animate-pulse">
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Header panel */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4" id="onboarding-guide-header">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Interactive Tutorial ({step + 1}/{steps.length})</span>
          </div>
          <button 
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition duration-150 cursor-pointer"
            title="Skip Onboarding Manual"
            id="btn-skip-onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info detail block */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-3.5 text-left" 
            id="onboarding-guide-body"
          >
            <h3 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-2">
              <span>{current.title}</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {current.description}
            </p>

            {/* Quick interactive highlight tip */}
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-start gap-2.5" id="onboarding-quick-tip-card">
              <Brain className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">PRO GUIDE TIP</span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{current.tip}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action controllers pane */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100" id="onboarding-guide-footer">
          <button
            onClick={onDismiss}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            id="btn-onboarding-skip-all"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                id="btn-onboarding-prev"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-extrabold shadow-md shadow-indigo-600/10 active:scale-98"
              id="btn-onboarding-next"
            >
              <span>{step === steps.length - 1 ? "Start Studying! 🎯" : "Next Option"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
