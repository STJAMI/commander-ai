import React, { useState } from "react";
import { Book, Plus, Check, Clock, AlertTriangle, Calendar, Star, Trash2 } from "lucide-react";
import { Subject, Chapter } from "../types";

interface SubjectManagerProps {
  subjects: Subject[];
  chapters: Chapter[];
  onAddSubject: (name: string, color: string) => void;
  onDeleteSubject: (id: string) => void;
  onAddChapter: (subjectId: string, title: string, difficulty: 'Easy'|'Medium'|'Hard', estimatedHours: number) => void;
  onDeleteChapter: (id: string) => void;
  onUpdateChapterStatus: (id: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onAddToSpacedRepetition: (chapterId: string) => void;
  spacedRepetitionIds: string[];
  onImportAISyllabus?: (
    parsedSubjects: { name: string; color: string; chapters: { title: string; difficulty: "Easy" | "Medium" | "Hard"; estimatedHours: number }[] }[],
    parsedExamDate: string,
    importMode: "merge" | "replace"
  ) => void;
  examDate?: string;
}

const CONST_COLORS = [
  "#4F46E5", // indigo
  "#2563EB", // blue
  "#7C3AED", // purple
  "#0D9488", // teal
  "#E11D48", // rose
  "#D97706", // amber
  "#059669", // emerald
];

export default function SubjectManager({
  subjects,
  chapters,
  onAddSubject,
  onDeleteSubject,
  onAddChapter,
  onDeleteChapter,
  onUpdateChapterStatus,
  onAddToSpacedRepetition,
  spacedRepetitionIds,
  onImportAISyllabus,
  examDate: propExamDate
}: SubjectManagerProps) {
  // Navigation internal state: select which subject's chapters are active
  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjects[0]?.id || "");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(CONST_COLORS[0]);

  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDifficulty, setNewChapterDifficulty] = useState<'Easy'|'Medium'|'Hard'>("Medium");
  const [newChapterHours, setNewChapterHours] = useState<number>(3);

  // AI Course Planner State Variables
  const [promptInput, setPromptInput] = useState("");
  const [refinePromptInput, setRefinePromptInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [importStrategy, setImportStrategy] = useState<"replace" | "merge">("replace");
  const [previewSubjectIndex, setPreviewSubjectIndex] = useState<number>(0);

  const handleAISyllabusParse = async (inputStr: string) => {
    if (!inputStr.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/parse-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: inputStr })
      });
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to parse syllabus options");
      }
      const data = await res.json();
      setAiResult(data);
      setPreviewSubjectIndex(0);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to analyze syllabus input. Check your Internet or API key settings.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefineProposal = async () => {
    if (!refinePromptInput.trim() || !aiResult) return;
    const combinedInput = `My current structured proposal is: ${JSON.stringify(aiResult)}. Now update it precisely based on my request: "${refinePromptInput}"`;
    setRefinePromptInput("");
    await handleAISyllabusParse(combinedInput);
  };

  const handleApplySyllabusPlan = () => {
    if (!aiResult || !onImportAISyllabus) return;
    onImportAISyllabus(aiResult.subjects, aiResult.examDate, importStrategy);
    setAiResult(null);
    setPromptInput("");
    setRefinePromptInput("");
  };

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];
  const activeChapters = activeSubject ? chapters.filter(c => c.subjectId === activeSubject.id) : [];

  // Calculations for active subject progress bar
  const totalWeight = activeChapters.length;
  const completedChapters = activeChapters.filter(c => c.status === "completed");
  const completedWeight = completedChapters.length;
  const activeSubjectPercent = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddSubject(newSubjectName.trim(), newSubjectColor);
    setNewSubjectName("");
    // Pick next random color
    const nextColor = CONST_COLORS[Math.floor(Math.random() * CONST_COLORS.length)];
    setNewSubjectColor(nextColor);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubjectId) return;
    if (!newChapterTitle.trim()) return;
    onAddChapter(activeSubjectId, newChapterTitle.trim(), newChapterDifficulty, Number(newChapterHours) || 3);
    setNewChapterTitle("");
    setNewChapterDifficulty("Medium");
    setNewChapterHours(3);
  };

  return (
    <div className="space-y-6" id="subject-manager-view-wrapper">
      
      {/* 🚀 AI Course Architect Bento Card */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden" id="ai-syllabus-architect-panel">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🧙‍♂️</span>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                  AI Syllabus Architect & Copilot
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono font-black border border-indigo-500/30 px-1.5 py-0.5 rounded-md uppercase">V2.0 Core</span>
                </h3>
                <p className="text-slate-400 text-xs">Instantly program your courses and chapters or build exam calendars using normal speech.</p>
              </div>
            </div>
            
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Ask for any subjects, chapters, & deadlines</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
            {/* Left box: Parser Prompt Box */}
            <div className="lg:col-span-6 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conversational Syllabus Brief</label>
                <textarea
                  id="ai-syllabus-brief-input"
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g., I have English, Chemistry, and College Algebra. My exams start in fifteen days on June 23rd. Chemistry needs atoms, bonds, and states of matter. Algebra needs linear equations and functions."
                  className="w-full text-xs p-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-200 placeholder-slate-600 leading-relaxed resize-none font-medium"
                />
              </div>

              {/* Presets suggestions */}
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Or tap standard presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = "I am studying College Algebra, Art, and Mechanical Physics. The exam is on July 2nd. Suggest 3 key study chapters for each.";
                      setPromptInput(text);
                      handleAISyllabusParse(text);
                    }}
                    className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-800/40 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 rounded-lg text-slate-405 hover:text-indigo-200 rounded-xl transition cursor-pointer text-left leading-tight"
                  >
                    📝 Algebra, Art, & Physics by Jul 2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = "Hi, my final tests on Chemistry and World History are on June 20th. Create standard high school level syllabus structures for me.";
                      setPromptInput(text);
                      handleAISyllabusParse(text);
                    }}
                    className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-800/40 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800 rounded-lg text-slate-405 hover:text-indigo-200 rounded-xl transition cursor-pointer text-left leading-tight"
                  >
                    📝 Chem & History by Jun 20
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={aiLoading || !promptInput.trim()}
                  onClick={() => handleAISyllabusParse(promptInput)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer select-none flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {aiLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Structuring Curriculum...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Generate Syllabus Profile</span>
                    </>
                  )}
                </button>
                
                {aiResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setAiResult(null);
                      setPromptInput("");
                    }}
                    className="text-slate-400 hover:text-slate-300 text-xs px-2.5 py-1.5 transition underline cursor-pointer"
                  >
                    Reset Proposal
                  </button>
                )}
              </div>

              {aiError && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-2xl flex items-center gap-2 text-xs text-red-300 leading-normal">
                  <span className="text-sm shrink-0">⚠️</span>
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* Right box: Real-time Live Proposal Preview */}
            <div className="lg:col-span-6 bg-slate-950/40 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between min-h-[220px]" id="ai-proposal-preview">
              {aiLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3 h-full">
                  <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400 font-bold tracking-wide animate-pulse">Consulting academic counselor...</span>
                </div>
              ) : aiResult ? (
                <div className="space-y-4">
                  {/* Proposal Summary Headers */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Proposed Calendar</span>
                      <strong className="text-emerald-400 text-xs font-mono">{aiResult.examDate ? new Date(aiResult.examDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : "Not defined"}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Courses Parsed</span>
                      <strong className="text-indigo-400 text-xs font-mono">{aiResult.subjects?.length} Subjects</strong>
                    </div>
                  </div>

                  {/* Syllabus Navigation layout preview */}
                  <div className="space-y-3">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                      {aiResult.subjects?.map((sub: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewSubjectIndex(idx)}
                          className={`px-3 py-1.5 text-[10px] font-bold tracking-tight rounded-xl shrink-0 transition cursor-pointer border ${
                            previewSubjectIndex === idx
                              ? "bg-indigo-600/25 text-indigo-200 border-indigo-500"
                              : "bg-slate-900 border-slate-800 hover:border-slate-705"
                          }`}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: sub.color || '#6366F1' }}></span>
                          {sub.name}
                        </button>
                      ))}
                    </div>

                    {/* Chapters of active preview */}
                    {aiResult.subjects?.[previewSubjectIndex] && (
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Chapters of "{aiResult.subjects[previewSubjectIndex].name}":</span>
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {aiResult.subjects[previewSubjectIndex].chapters?.map((chap: any, cidx: number) => (
                            <div key={cidx} className="flex justify-between items-center text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-300">
                              <span className="font-bold block truncate max-w-[180px]">{chap.title}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded-md font-mono text-[8px] font-bold uppercase ${
                                  chap.difficulty === 'Hard' ? 'bg-red-500/15 text-red-350' : chap.difficulty === 'Easy' ? 'bg-teal-500/15 text-teal-350' : 'bg-amber-500/15 text-amber-305'
                                }`}>{chap.difficulty}</span>
                                <span className="opacity-50 text-[9px] font-semibold">{chap.estimatedHours}h study</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Refiner Dialog Conversation Input ("ask me if anything needed") */}
                  <div className="border-t border-slate-850/60 pt-3 space-y-2.5">
                    <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl text-[11px] text-indigo-300 leading-normal flex items-start gap-2">
                      <span className="text-sm shrink-0">💬</span>
                      <p className="font-semibold">
                        <strong>AI Tutor Assistant:</strong> "{aiResult.clarificationPrompt || "Do you need to refine the layout or shall we build your planner?"}"
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={refinePromptInput}
                        onChange={(e) => setRefinePromptInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRefineProposal();
                        }}
                        disabled={aiLoading}
                        placeholder="e.g., That looks good. Add organic chemistry as well."
                        className="flex-1 text-[11px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-650 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleRefineProposal}
                        className="bg-slate-800 hover:bg-slate-700 text-xs px-3.5 py-2 rounded-xl transition cursor-pointer font-bold"
                      >
                        Refine
                      </button>
                    </div>
                  </div>

                  {/* Enlist CTA controllers */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-850">
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setImportStrategy("replace")}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition cursor-pointer ${
                          importStrategy === "replace"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Start Fresh
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportStrategy("merge")}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition cursor-pointer ${
                          importStrategy === "merge"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Append subjects without wiping current dataset"
                      >
                        Merge
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplySyllabusPlan}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl h-10 cursor-pointer transition select-none flex items-center justify-center gap-1 shrink-0 shadow-sm shadow-emerald-500/10"
                    >
                      <span>✨ Register & Build Syllabus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2.5 text-slate-500 h-full">
                  <span className="text-3xl">🎯</span>
                  <strong className="text-xs text-slate-400 font-bold block">Live Curriculum Review Deck</strong>
                  <span className="text-[10px] text-slate-500 px-6 max-w-sm block leading-normal">
                    Enter your targets in the brief panel on the left, or select a standard preset. Your dynamic curriculum blueprint will render here instantly!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="subject-manager-view">
      {/* Subject list columns (sidebar-style list within page context) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 lg:col-span-4 flex flex-col justify-between shadow-sm" id="subject-sidebar-panel">
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1 tracking-tight">Subject Course Hub</h3>
          <p className="text-slate-400 text-xs mb-4">Enroll and manage active courses of the current syllabus</p>
 
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {subjects.map((sub) => {
              const subChapters = chapters.filter(c => c.subjectId === sub.id);
              const done = subChapters.filter(c => c.status === "completed").length;
              const total = subChapters.length;
              const isSelected = activeSubjectId === sub.id;
 
              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveSubjectId(sub.id)}
                  id={`subject-item-${sub.id}`}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition duration-150 ${
                    isSelected
                      ? "border-indigo-200 bg-indigo-50/60"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    ></span>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block truncate max-w-[150px]">
                        {sub.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {done}/{total} Chapters ({(total > 0 ? Math.round((done / total) * 100) : 0)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        onDeleteSubject(sub.id);
                        if (activeSubjectId === sub.id) {
                          setActiveSubjectId(subjects.find(s => s.id !== sub.id)?.id || "");
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* Add Subject form */}
        <form onSubmit={handleCreateSubject} className="border-t border-slate-200 pt-4 mt-4" id="add-subject-form">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Create New Course</span>
          <div className="space-y-3">
            <input
              type="text"
              id="new-subject-name-input"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="e.g., Mathematics 2nd Paper"
              className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
            {/* Color selector picker component with custom color picker */}
            <div className="space-y-2 bg-slate-50 border border-slate-100 p-2.5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Badge Style Color</span>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                  {newSubjectColor}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CONST_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewSubjectColor(col)}
                      className={`w-4 h-4 rounded-full border border-slate-200/50 transition cursor-pointer ${
                        newSubjectColor.toLowerCase() === col.toLowerCase()
                          ? "ring-2 ring-offset-1 ring-indigo-500 scale-110"
                          : "opacity-85 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col }}
                      title={`Preset: ${col}`}
                    ></button>
                  ))}
                  
                  {/* Custom color picker component spectrum circle */}
                  <span className="w-[1px] h-3 bg-slate-200 mx-0.5"></span>
                  <div 
                    className={`relative w-[18px] h-[18px] rounded-full border border-slate-200 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-500 via-indigo-500 to-teal-400 hover:scale-115 transition shrink-0 ${
                      !CONST_COLORS.slice().map(c => c.toLowerCase()).includes(newSubjectColor.toLowerCase())
                        ? "ring-2 ring-offset-1 ring-indigo-500 scale-110"
                        : ""
                    }`}
                    title="Select Custom Custom Color"
                  >
                    <input
                      type="color"
                      value={newSubjectColor}
                      onChange={(e) => setNewSubjectColor(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <span className="text-[11px] font-extrabold text-white leading-none pointer-events-none drop-shadow-xs">+</span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold tracking-wide uppercase px-3 py-1.5 rounded-xl transition shrink-0 cursor-pointer shadow-2xs"
                >
                  Enroll
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
 
      {/* Chapters tracking panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 lg:col-span-8 flex flex-col justify-between shadow-sm" id="chapters-grid-panel">
        <div>
          {activeSubject ? (
            <div>
              {/* Active Subject Title Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: activeSubject.color }}
                  ></span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base" id="active-subject-header">{activeSubject.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Progress Bar status tracking</p>
                  </div>
                </div>
                
                {/* Visual completion progress bar matching example 57% Done */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${activeSubjectPercent}%` }}
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-800 min-w-[32px] text-right">{activeSubjectPercent}% Complete</span>
                </div>
              </div>
 
              {/* Add Chapter form */}
              <form onSubmit={handleCreateChapter} className="flex flex-col sm:flex-row items-end gap-3.5 bg-slate-50 p-4 border border-slate-200 rounded-2xl mb-5 shadow-2xs" id="add-chapter-form">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wi">New Chapter Title</label>
                  <input
                    type="text"
                    id="new-chapter-title-input"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="e.g., Chapter 4: Newtonian Mechanics"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>
                <div className="w-full sm:w-28 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wi">Difficulty</label>
                  <select
                    value={newChapterDifficulty}
                    onChange={(e) => setNewChapterDifficulty(e.target.value as 'Easy'|'Medium'|'Hard')}
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="w-full sm:w-24 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wi">Est. Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    id="new-chapter-hours-input"
                    value={newChapterHours}
                    onChange={(e) => setNewChapterHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs px-2 px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-slate-850 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 cursor-pointer h-9"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Chapter</span>
                </button>
              </form>
 
              {/* Chapters Syllabus list (showing checkboxes & status matching Example: Physics 1 table) */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {activeChapters.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                    Syllabus is currently empty. Input chapters above.
                  </div>
                ) : (
                  activeChapters.map((chapter) => {
                    const isRepetitionActive = spacedRepetitionIds.includes(chapter.id);
                    return (
                      <div
                        key={chapter.id}
                        id={`chapter-row-${chapter.id}`}
                        className="p-3.5 border border-slate-200 hover:border-indigo-200 bg-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition duration-150"
                      >
                        <div className="flex items-start gap-3">
                          {/* Circle Status Toggle Button */}
                          <button
                            onClick={() => {
                              const nextStatus = chapter.status === 'completed' 
                                ? 'not_started' 
                                : chapter.status === 'in_progress' 
                                  ? 'completed' 
                                  : 'in_progress';
                              onUpdateChapterStatus(chapter.id, nextStatus);
                            }}
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 ${
                              chapter.status === 'completed'
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : chapter.status === 'in_progress'
                                  ? "bg-indigo-50 border-indigo-400 text-indigo-500 font-extrabold text-[11px]"
                                  : "border-slate-300 text-transparent hover:border-slate-400"
                            }`}
                          >
                            {chapter.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            {chapter.status === 'in_progress' && "◐"}
                            {chapter.status === 'not_started' && "□"}
                          </button>
 
                          <div>
                            <span className={`text-xs font-bold ${
                              chapter.status === "completed" ? "line-through text-slate-400 font-medium" : "text-slate-800"
                            }`}>
                              {chapter.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase ${
                                chapter.difficulty === 'Easy'
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : chapter.difficulty === 'Medium'
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-150"
                              }`}>
                                {chapter.difficulty} Difficulty
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                                <Clock className="w-3 h-3 text-slate-300 animate-pulse" />
                                {chapter.estimatedHours}h estimated time
                              </span>
                            </div>
                          </div>
                        </div>
 
                        {/* Revision scheduling and actions buttons */}
                        <div className="flex items-center gap-2 sm:self-center self-end">
                          <button
                            onClick={() => onAddToSpacedRepetition(chapter.id)}
                            disabled={isRepetitionActive}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight flex items-center gap-1.5 transition cursor-pointer ${
                              isRepetitionActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-indigo-50 hover:bg-indigo-150 text-indigo-700"
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{isRepetitionActive ? "Syllabus Spaced" : "Add Spaced Rep"}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              const confirmDelete = window.confirm(`Remove chapter "${chapter.title}" from course syllabus?`);
                              if (confirmDelete) onDeleteChapter(chapter.id);
                            }}
                            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer border border-transparent hover:border-slate-100"
                            title="Delete Chapter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <Book className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-bold">No active subjects found</p>
              <p className="text-slate-400 text-xs mt-1">Add subjects/courses on the left to start tracing syllabus chapters.</p>
            </div>
          )}
        </div>
 
        <div className="bg-amber-50/50 border border-amber-250 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed mt-6 font-medium">
          <strong>Pro-Tip on Statuses:</strong> Click the status indicator checkbox to cycles completion tracking ({"□"} Not Started {"→"} {"◐"} In Progress {"→"} {"✓"} Completed). Marking chapters completed logs them as ready for spacing reinforcement checks.
        </div>
      </div>
    </div>
    </div>
  );
}
