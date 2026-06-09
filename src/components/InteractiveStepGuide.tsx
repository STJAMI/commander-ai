import React, { useState } from "react";
import { CheckCircle2, Circle, ArrowRight, Sparkles, BookOpen, Calendar, Rocket, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InteractiveStepGuideProps {
  subjectsCount: number;
  chaptersCount: number;
  hasRoutine: boolean;
  focusMinutes: number;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLoadDemoData: () => void;
  onClearDemoData: () => void;
}

export default function InteractiveStepGuide({
  subjectsCount,
  chaptersCount,
  hasRoutine,
  focusMinutes,
  activeTab,
  setActiveTab,
  onLoadDemoData,
  onClearDemoData,
}: InteractiveStepGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Core setup checklist requirements
  const steps = [
    {
      id: "subjects",
      title: "Step 1: Set Up Course Subjects 📚",
      description: "Define the core disciplines you need to study (e.g. Physics, Math, Code, History).",
      completed: subjectsCount > 0,
      actionLabel: "Go Add Subjects",
      targetTab: "syllabus" as const,
      hint: "Use either manual addition or formulate them via speech/text in our AI Syllabus Architect."
    },
    {
      id: "chapters",
      title: "Step 2: Program Syllabus Chapters 📖",
      description: "Add chapters to your subjects, assigning difficulty and estimated revision hours.",
      completed: chaptersCount > 0,
      actionLabel: "Add Chapters",
      targetTab: "syllabus" as const,
      hint: "Weighting difficulties ensures the AI properly allocates study weights to tough concepts.",
      disabled: subjectsCount === 0
    },
    {
      id: "routine",
      title: "Step 3: Organize Study Routine 🗓️",
      description: "Generate an AI study routine sequence based on your target exam date.",
      completed: hasRoutine,
      actionLabel: "Design Calendar Work-slots",
      targetTab: "planner" as const,
      hint: "Go to Study Planner to model available hours and compute dynamic review lanes.",
      disabled: chaptersCount === 0
    },
    {
      id: "focus",
      title: "Step 4: Kickstart Your First Focus Loop ⏱️",
      description: "Log active study minutes by running a session inside the Pomodoro panel.",
      completed: focusMinutes > 0,
      actionLabel: "Enter Focus Terminal",
      targetTab: "dashboard" as const,
      hint: "Tune ambient Focus Rain or Cafe Chatter sounds to enter the zone.",
      disabled: !hasRoutine
    }
  ];

  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.completed).length;
  const percentComplete = Math.round((completedSteps / totalSteps) * 100);

  // Find current active step that needs completion
  const currentStepIndex = steps.findIndex(s => !s.completed);
  const activeGuideStep = currentStepIndex !== -1 ? steps[currentStepIndex] : null;

  return (
    <div 
      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden" 
      id="setup-interactive-roadmap-companion"
    >
      <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-50 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8"></div>
      
      {/* Header and collapsing toggler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-10/10 pb-4 mb-5" id="guide-companion-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-2xs">
            <Rocket className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Academic Flight-Deck Boarding Guide</h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                {percentComplete}% Set Up
              </span>
            </div>
            <p className="text-slate-400 text-xs">Let's configure your study cockpit step-by-step for optimal retention.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2" id="guide-companion-header-actions">
          {completedSteps < totalSteps && (
            <button
              onClick={onLoadDemoData}
              className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 active:scale-95 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition"
              title="Populate mock subjects, chapters, and tasks to explore features instantly"
              id="btn-guide-load-demo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Trial Template</span>
            </button>
          )}

          {completedSteps > 0 && (
            <button
              onClick={onClearDemoData}
              className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 active:scale-95 font-bold px-3 py-1.5 rounded-xl cursor-pointer transition"
              title="Clear all local data and reset syllabus"
              id="btn-guide-clear-data"
            >
              <span>Reset Slate</span>
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer px-1 py-1"
            id="btn-toggle-guide-collapse"
          >
            {isCollapsed ? "Show Guides" : "Minimize"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4 text-left overflow-hidden"
          >
            {/* Visual Step Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="guide-road-steps-timeline">
              {steps.map((step, idx) => {
                const isCurrent = activeGuideStep?.id === step.id;
                return (
                  <div 
                    key={step.id} 
                    className={`relative border p-3.5 rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                      step.completed 
                        ? "border-emerald-200 bg-emerald-50/15" 
                        : isCurrent 
                          ? "border-indigo-200 bg-indigo-50/20 shadow-md" 
                          : "border-slate-200 bg-slate-50/20 opacity-60"
                    }`}
                    id={`guide-timeline-card-${idx}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                          Task 0{idx + 1}
                        </span>
                        {step.completed ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-50 shrink-0" />
                        ) : (
                          <Circle className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`} />
                        )}
                      </div>
                      
                      <h4 className={`text-xs font-extrabold ${step.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {step.description}
                      </p>
                    </div>

                    {!step.completed && !step.disabled && (
                      <button
                        onClick={() => setActiveTab(step.targetTab)}
                        className="mt-3 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-97"
                      >
                        <span>{step.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {step.disabled && (
                      <span className="mt-3 text-[9px] font-mono font-extrabold uppercase text-slate-400 bg-slate-100 text-center py-1.5 rounded-lg border border-slate-200/50">
                        Locked (Pending Step {idx})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Active Step Interactive Helper panel */}
            {activeGuideStep && (
              <div 
                className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2" 
                id="active-guide-advisor-banner"
              >
                <div className="flex gap-2.5 text-left">
                  <div className="text-xl">💡</div>
                  <div>
                    <h5 className="text-xs font-black text-indigo-900 uppercase tracking-wide">
                      Active Setup Advisor Goal
                    </h5>
                    <p className="text-[11px] text-indigo-700 leading-relaxed mt-0.5">
                      {activeGuideStep.hint}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab(activeGuideStep.targetTab)}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm shadow-indigo-600/10 cursor-pointer active:scale-97 flex items-center gap-1"
                >
                  <span>Complete Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Empty state congrats when 100% complete */}
            {completedSteps === totalSteps && (
              <div 
                className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between gap-4 mt-2" 
                id="active-guide-advisor-banner-completed"
              >
                <div className="flex gap-2.5 text-left">
                  <div className="text-xl">🏆</div>
                  <div>
                    <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                      Cockpit Fully Configured!
                    </h5>
                    <p className="text-[11px] text-emerald-700 leading-normal mt-0.5">
                      Magnificent setup sequence. Your physical & academic workspace is completely online. Use your Pomodoros, flashcards, and exam sim modules anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
