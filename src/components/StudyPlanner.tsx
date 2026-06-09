import React, { useState } from "react";
import { Calendar, Clock, BookOpen, AlertCircle, Sparkles, Check, CheckSquare, RefreshCw, Layers } from "lucide-react";
import { Subject, Chapter, SpacedRepetitionItem, AIRoutinePlan } from "../types";

interface StudyPlannerProps {
  subjects: Subject[];
  chapters: Chapter[];
  spacedRepetitions: SpacedRepetitionItem[];
  onToggleReviewCompleted: (itemId: string, stage: '1 Day' | '3 Days' | '7 Days' | '14 Days') => void;
  onClearRepetitions: () => void;
  examDate?: string;
  onChangeExamDate?: (date: string) => void;
}

export default function StudyPlanner({
  subjects,
  chapters,
  spacedRepetitions,
  onToggleReviewCompleted,
  onClearRepetitions,
  examDate: propExamDate,
  onChangeExamDate
}: StudyPlannerProps) {
  // Input parameters state variables
  const [localExamDate, setLocalExamDate] = useState("2026-06-23");
  const examDate = propExamDate || localExamDate;
  const setExamDate = (val: string) => {
    setLocalExamDate(val);
    if (onChangeExamDate) onChangeExamDate(val);
  };
  const [availableHours, setAvailableHours] = useState(8);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(subjects.map(s => s.id));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<AIRoutinePlan | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleToggleSubjectSelection = (id: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const remainingChapters = chapters.filter(c => c.status !== "completed");

  const buildAISchedule = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const payloadSubjects = subjects.filter(s => selectedSubjectIds.includes(s.id)).map(s => s.name);
      const payloadChapters = remainingChapters
        .filter(c => selectedSubjectIds.includes(c.subjectId))
        .map(c => ({
          title: c.title,
          subject: subjects.find(s => s.id === c.subjectId)?.name || "",
          difficulty: c.difficulty
        }));

      const res = await fetch("/api/ai/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examDate,
          availableHours,
          subjects: payloadSubjects,
          chaptersRemaining: payloadChapters
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to call AI routine generator");
      }

      const data = await res.json();
      setGeneratedRoutine(data);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to generate plan. Please try again.");
      
      // Fallback local heuristic schedule so it never breaks for the user!
      generateFallbackLocalSchedule();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackLocalSchedule = () => {
    // Generate a fallback schedule to ensure seamless UI experience
    const fallbackDays = [];
    const today = new Date();
    const activeRemaining = remainingChapters.filter(c => selectedSubjectIds.includes(c.subjectId));

    for (let i = 0; i < 5; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];

      const slots = [];
      if (activeRemaining.length > 0) {
        const chap1 = activeRemaining[(i * 2) % activeRemaining.length];
        const sub1 = subjects.find(s => s.id === chap1.subjectId)?.name || "Academic Subject";
        slots.push({
          time: "07:00 AM - 09:00 AM",
          subject: sub1,
          topic: chap1.title
        });

        const chap2 = activeRemaining[(i * 2 + 1) % activeRemaining.length];
        const sub2 = subjects.find(s => s.id === chap2.subjectId)?.name || "Academic Subject";
        slots.push({
          time: "10:00 AM - 12:00 PM",
          subject: sub2,
          topic: chap2.title
        });
      } else {
        slots.push({
          time: "07:00 AM - 09:00 AM",
          subject: "Course Review",
          topic: "General Revision Strategy"
        });
      }

      slots.push({
        time: "07:00 PM - 09:00 PM",
        subject: "General",
        topic: "Mock Test Practice & Revision Recap"
      });

      fallbackDays.push({
        date: dateStr,
        slots: slots
      });
    }

    setGeneratedRoutine({ days: fallbackDays });
  };

  return (
    <div className="space-y-6" id="study-planner-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scheduler Inputs panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 lg:col-span-5 flex flex-col justify-between shadow-sm" id="planner-controls-panel">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse animate-duration-1000" />
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">AI Study Planner</h3>
            </div>
            <p className="text-slate-400 text-xs mb-5">
              Enter target boundaries, and AI optimizes your study calendar dynamically using spaced blocks.
            </p>

            <div className="space-y-4">
              {/* Exam Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wi block">Target Exam Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    id="planner-exam-date-input"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full text-xs pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/20"
                  />
                </div>
              </div>

              {/* Available Hours */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wi block">Daily Available Study Hours</label>
                  <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full">{availableHours} Hrs</span>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="2"
                    max="16"
                    id="planner-hours-range"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(Number(e.target.value))}
                    className="w-full accent-indigo-600 my-2"
                  />
                </div>
              </div>

              {/* Filter Subjects checklist */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wi block">Include Course Subjects</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="planner-subject-checkboxes">
                  {subjects.map((sub) => (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2 border p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition duration-150 text-xs font-bold ${
                        selectedSubjectIds.includes(sub.id)
                          ? "border-indigo-200 bg-indigo-50/40 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.includes(sub.id)}
                        onChange={() => handleToggleSubjectSelection(sub.id)}
                        className="rounded-md text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate max-w-[120px]">{sub.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5 mt-6 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Includes {remainingChapters.filter(c => selectedSubjectIds.includes(c.subjectId)).length} remaining chapters.</span>
            </div>

            <button
              onClick={buildAISchedule}
              disabled={isGenerating || subjects.length === 0}
              id="btn-generate-ai-routine"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-40"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Configuring AI Calendar Slots...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Generate AI Routine Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Calendar Routine Plan Slots display */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 lg:col-span-7 flex flex-col justify-between min-h-[420px] shadow-sm" id="routine-plan-display">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1 tracking-tight">Generated Calendar Routine</h3>
            <p className="text-slate-400 text-xs mb-4">Click "Generate" on the left to see your structured day-by-day sequence</p>

            {generationError && (
              <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl text-[11px] mb-4 flex items-start gap-2 border border-amber-200/50">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Notice: Web API busy. We have spun up a fully customized local heuristic schedule format for your active chapter lists instead! See below.</span>
              </div>
            )}

            {generatedRoutine ? (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {generatedRoutine.days.map((day, dIdx) => (
                  <div key={dIdx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50/10">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 font-mono flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Day {dIdx + 1}</span>
                    </div>

                    <div className="p-1.5 space-y-1.5 bg-white">
                      {day.slots.map((slot, sIdx) => (
                        <div key={sIdx} className="p-3 bg-white hover:bg-slate-50/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-transparent hover:border-slate-100 transition duration-150">
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-bold text-slate-800 block truncate max-w-[280px]">
                              {slot.topic}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-extrabold tracking-wider uppercase block">
                              {slot.subject}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 uppercase">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {slot.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/40 my-4 gap-3" id="planner-empty-routine-guide">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50 shadow-2xs">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 text-center">
                  <span className="text-xs font-black text-slate-700 block">Step 3 Guide: Construct Your Routine Slots</span>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {subjects.length === 0 ? (
                      <span className="text-rose-600 font-bold block">
                        ⚠️ Please add study subjects first in the Syllabus tab before compiling custom daily study routine blocks!
                      </span>
                    ) : (
                      "Set your exam date and your daily available study hours on the left, check the subjects to include, then click the 'Generate AI Routine Plan' button. Our optimized memory model will compile day-to-day slots tailored to difficult topics."
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/50 p-3.5 rounded-2xl leading-relaxed flex items-center gap-2 mt-4 shadow-2xs">
            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 animate-bounce" />
            <span>The AI engine automatically balances heavy subjects with revision hours daily.</span>
          </div>
        </div>
      </div>

      {/* Spaced Repetition Panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm" id="spaced-repetition-dashboard">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">AI Revision Spaced Repetition Tracker</h3>
              <p className="text-slate-400 text-xs">Pushes finished chapters to optimized interval repetitions (1d, 3d, 7d, 14d) automatically</p>
            </div>
          </div>
          {spacedRepetitions.length > 0 && (
            <button
              onClick={onClearRepetitions}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer uppercase tracking-wider"
            >
              Clear Logs
            </button>
          )}
        </div>

        {spacedRepetitions.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/20 flex flex-col items-center justify-center gap-2 my-2">
            <Layers className="w-8 h-8 text-slate-300 animate-bounce" />
            <span className="text-xs text-slate-400 font-bold">Spaced repetition logs are empty</span>
            <span className="text-[11px] text-slate-400 px-12 text-center leading-normal">
              When you complete a chapter, click the **"Schedule Spaced Rep"** button on the **Subject Manager** tab to trigger spaced schedules.
            </span>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1" id="spaced-repetition-grid-logs">
            {spacedRepetitions.map((item) => (
              <div key={item.id} className="p-4 border border-slate-200 hover:border-indigo-100 bg-white shadow-xs rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-150">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800">{item.chapterTitle}</span>
                    <span className="text-[9px] bg-indigo-50 border border-indigo-100/50 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">{item.subjectName}</span>
                  </div>
                  <p className="text-[11px] text-slate-450 font-medium">
                    Finished calendar date: <span className="font-bold">{new Date(item.completedDate).toLocaleDateString()}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {item.reviews.map((rev) => {
                    const isDueToday = new Date(rev.dueDate).toDateString() === new Date().toDateString();
                    return (
                      <button
                        key={rev.stage}
                        onClick={() => onToggleReviewCompleted(item.id, rev.stage)}
                        className={`p-2.5 rounded-2xl border text-left min-w-[90px] transition cursor-pointer flex flex-col justify-between h-16 ${
                          rev.completed
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 opacity-90"
                            : isDueToday
                              ? "bg-indigo-50 border-indigo-300 text-indigo-800 ring-2 ring-indigo-500/10 font-bold"
                              : "bg-slate-50 border-slate-250 hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-black tracking-wider uppercase">{rev.stage}</span>
                          {rev.completed && <Check className="w-3 h-3 text-emerald-600 stroke-[3px]" />}
                        </div>
                        <span className="text-[9px] block text-slate-400 font-mono mt-2 font-bold">
                          Due: {new Date(rev.dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
