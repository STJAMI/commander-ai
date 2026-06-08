import React, { useState, useEffect } from "react";
import { Sparkles, Brain, Clock, Zap, AlertTriangle, RefreshCw, Loader2, HelpCircle } from "lucide-react";
import { Subject, Chapter } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MemoryEngineProps {
  subjects: Subject[];
  chapters: Chapter[];
}

export default function MemoryEngine({ subjects, chapters }: MemoryEngineProps) {
  const completedChapters = chapters.filter(c => c.status === "completed");
  const [selectedChapterId, setSelectedChapterId] = useState(completedChapters[0]?.id || "");
  const [activeRecallScore, setActiveRecallScore] = useState<number>(4);
  const [daysElapsed, setDaysElapsed] = useState<number>(1);
  const [recallPrompt, setRecallPrompt] = useState<{ prompt: string, hint: string, answer: string } | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Auto-switch selected chapter if list changes or loads
  useEffect(() => {
    if (!selectedChapterId && completedChapters.length > 0) {
      setSelectedChapterId(completedChapters[0].id);
    }
  }, [completedChapters]);

  const selectedChapter = completedChapters.find(c => c.id === selectedChapterId);
  const selectedSubject = selectedChapter ? subjects.find(s => s.id === selectedChapter.subjectId) : null;

  // Active Recall memory retention mathematical calculation (SM-2 / Halflife heuristics)
  // R = e^(-t/S) where strength (S) increases exponentially with recall score
  // If score = 5, strength is high (decay is slow). If score = 1, strength is low (rapid decay)
  const calculateRetention = (days: number, score: number) => {
    const strengthFactor = Math.pow(1.6, score) * 1.5; // Heuristic
    const retention = Math.exp(-days / strengthFactor);
    return Math.round(retention * 100);
  };

  const currentRetention = selectedChapter 
    ? calculateRetention(daysElapsed, activeRecallScore) 
    : 80;

  // Generate Forgetting Curve dataset for day 0 to 15
  const graphData = Array.from({ length: 16 }, (_, idx) => {
    const day = idx;
    return {
      day: `Day ${day}`,
      retention: calculateRetention(day, activeRecallScore)
    };
  });

  const generateAIPrompt = async () => {
    if (!selectedChapter || !selectedSubject) return;
    setIsGeneratingPrompt(true);
    setRecallPrompt(null);
    setShowHint(false);
    setShowAnswer(false);
    
    try {
      const res = await fetch("/api/ai/memory-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject.name,
          chapter: selectedChapter.title
        })
      });

      if (!res.ok) throw new Error("Failed to consult memory generator");
      const data = await res.json();
      setRecallPrompt(data);
    } catch (e: any) {
      console.error(e);
      setRecallPrompt({
        prompt: `Review the foundational formulas and derivations of ${selectedChapter.title}.`,
        hint: "Formulate a quick concept maps schematic of this topic.",
        answer: "Consult your study manager cheatsheets to grade your current knowledge parity."
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="spaced-memory-engine">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
          <Brain className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Hermann Ebbinghaus Cognitive Modeling</span>
        </span>
        <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">Memory decay & Forgetting Curve</h2>
        <p className="text-slate-400 text-xs">Visualize memory strength decays and trigger dynamic active recall sessions to consolidate neurostructures.</p>
      </div>

      {completedChapters.length === 0 ? (
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No syllabus chapters marked "completed" yet!</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Once you mark chapters as completed in your Subject Manager, they will appear here to calculate active biological memory retention.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs & Visual Stats */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-3">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Select Completed Chapter</label>
              <select
                value={selectedChapterId}
                onChange={(e) => {
                  setSelectedChapterId(e.target.value);
                  setRecallPrompt(null);
                }}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-bold"
              >
                {completedChapters.map(c => {
                  const sub = subjects.find(s => s.id === c.subjectId);
                  return (
                    <option key={c.id} value={c.id}>
                      {sub ? `[${sub.name}] ` : ""}{c.title}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Score Active Recall Rating */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                <span className="font-extrabold text-slate-500">Confidence Self-Score</span>
                <span className="text-indigo-600 font-extrabold font-mono text-xs">{activeRecallScore}/5 Level</span>
              </div>
              <div className="grid grid-cols-5 gap-2" id="score-block-selector">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setActiveRecallScore(s);
                      setRecallPrompt(null);
                    }}
                    className={`py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                      activeRecallScore === s
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s === 1 ? "😞" : s === 2 ? "🤕" : s === 3 ? "😐" : s === 4 ? "😃" : "🏆"}
                  </button>
                ))}
              </div>
            </div>

            {/* Days Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                <span className="font-extrabold text-slate-500">Simulate Elapsed Time</span>
                <span className="text-slate-700 font-extrabold font-mono text-xs">{daysElapsed} Days Out</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={daysElapsed}
                onChange={(e) => setDaysElapsed(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
                title="Time elapsed since recall session"
              />
            </div>

            {/* Retention Output Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Biological Retention</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">Predicted knowledge hold index score.</p>
              </div>
              <div className={`p-3 rounded-2xl flex flex-col items-center justify-center shrink-0 w-16 h-16 ${
                currentRetention > 80 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : currentRetention > 50 
                    ? "bg-amber-50 text-amber-700 border border-amber-100" 
                    : "bg-rose-50 text-rose-700 border border-rose-100"
              }`}>
                <span className="text-xl font-black font-mono leading-none">{currentRetention}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart & Recall Prompt */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Predicted Retentive Decay (0 - 15 Days)</h4>
              <div className="h-36 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#94a3b8" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "#94a3b8" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "10px", color: "#ffffff", fontSize: "10px" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="retention" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ stroke: "#818cf8", strokeWidth: 1, r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Generator section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 uppercase font-mono text-[9px] font-extrabold text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>Gemini Memory Reinforcement</span>
                </div>
                <button
                  type="button"
                  disabled={isGeneratingPrompt}
                  onClick={generateAIPrompt}
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-250 text-white text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer"
                >
                  {isGeneratingPrompt ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>Formulating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Recall Challenge</span>
                    </>
                  )}
                </button>
              </div>

              {recallPrompt ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-extrabold text-slate-800 leading-snug">"{recallPrompt.prompt}"</p>
                  
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="text-[9px] text-indigo-600 font-extrabold hover:underline flex items-center gap-0.5"
                    >
                      💡 {showHint ? "Hide Hint" : "Reveal Hint"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="text-[9px] text-indigo-600 font-extrabold hover:underline flex items-center gap-0.5"
                    >
                      📂 {showAnswer ? "Hide Verification Answer" : "Check Answer Key"}
                    </button>
                  </div>

                  {showHint && (
                    <div className="p-2 border-l-2 border-amber-400 bg-amber-50/40 text-[10px] text-slate-600 font-mono mt-1">
                      {recallPrompt.hint}
                    </div>
                  )}

                  {showAnswer && (
                    <div className="p-2 border-l-2 border-emerald-500 bg-emerald-50/40 text-[10px] text-slate-600 leading-normal font-sans rounded-r-lg mt-1">
                      {recallPrompt.answer}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">
                  Tap 'Recall Challenge' to synthesize a targeted high-yield questioning prompt from Gemini.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
