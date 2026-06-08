import React, { useState, useEffect } from "react";
import { Sparkles, HelpCircle, GraduationCap, ArrowRight, CheckSquare, RefreshCw, Layers, Check, Zap, Eye, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Subject, Chapter } from "../types";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  status?: "unstudied" | "need_review" | "mastered";
}

interface AIStudyFlashcardsProps {
  subjects: Subject[];
  chapters: Chapter[];
}

// Realistic initial pre-populated flashcards for Jami to study immediately
const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: "fc_init_1",
    front: "Euler's Formula for Complex Numbers",
    back: "e^(iθ) = cos(θ) + i sin(θ). This beautiful identity connects exponential functions with trigonometric values.",
    status: "need_review"
  },
  {
    id: "fc_init_2",
    front: "Newton's Second Law (Vector Version)",
    back: "F = dp/dt (Force equals the rate of change of momentum). For constant mass, this simplifies to F = ma.",
    status: "unstudied"
  },
  {
    id: "fc_init_3",
    front: "TCP (Transmission Control Protocol) Core Features",
    back: "Connection-oriented, reliable transmission, flow control, error checking, and packet sequencing guaranteed.",
    status: "mastered"
  },
  {
    id: "fc_init_4",
    front: "Absolute Zero Temp in Celsius",
    back: "-273.15°C (The fundamental limit where thermodynamic system kinetic motion ceases completely).",
    status: "unstudied"
  }
];

export default function AIStudyFlashcards({ subjects, chapters }: AIStudyFlashcardsProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [chapterId, setChapterId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem("study_commander_flashcards");
    return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    localStorage.setItem("study_commander_flashcards", JSON.stringify(flashcards));
  }, [flashcards]);

  const activeSubjectChapters = chapters.filter(c => c.subjectId === subjectId);

  const triggerGenerateAI = async () => {
    setIsGenerating(true);
    setErrorStr(null);
    setIsFlipped(false);

    const subjectObj = subjects.find(s => s.id === subjectId);
    const chapterObj = chapters.find(c => c.id === chapterId);

    const subName = subjectObj ? subjectObj.name : "Engineering Course";
    const chapName = chapterObj ? chapterObj.title : "General Topic";

    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subName, chapter: chapName })
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to make AI flashcards");
      }

      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        const formatted: Flashcard[] = data.flashcards.map((fc: any) => ({
          id: fc.id || Math.random().toString(),
          front: fc.front,
          back: fc.back,
          status: "unstudied"
        }));
        setFlashcards(formatted);
        setCurrentIndex(0);
      } else {
        throw new Error("No flashcards received from the response payload");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStr(err.message || "Failed to call AI study wizard server setup.");
      
      // Load fallback mock flashcards matching their selection so they see actual data
      const mockChaps = [
        { id: "mc1", front: `What is the key theorem of ${chapName}?`, back: `It asserts that the core systems remain robust under initial diagnostic checks of study limits.` },
        { id: "mc2", front: `Name one common mistake students make in ${subName}`, back: `Overlooking boundary conditions or skipping active quizzer tests.` },
        { id: "mc3", front: `What are the basic formulas related to ${chapName}?`, back: `Standard equations: E_total = K_energy(t) + U_potential(t) = constant.` }
      ];
      setFlashcards(mockChaps);
      setCurrentIndex(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = (status: "need_review" | "mastered") => {
    if (flashcards.length === 0) return;
    setFlashcards(prev => prev.map((fc, idx) => {
      if (idx === currentIndex) {
        return { ...fc, status };
      }
      return fc;
    }));
    
    // Automatically advance after marking to speed up Jami's study momentum!
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      }
    }, 250);
  };

  const completedCount = flashcards.filter(f => f.status === "mastered").length;
  const reviewCount = flashcards.filter(f => f.status === "need_review").length;
  const unstudiedCount = flashcards.filter(f => !f.status || f.status === "unstudied").length;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="ai-flashcards-section">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗂️</span>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Active Recall Flashcards</h3>
            <p className="text-slate-400 text-xs">Flip cards to test memory retention with self-assessed study statistics</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-[10px] font-mono select-none">
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 border border-emerald-100 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Mastered: {completedCount}</span>
          </div>
          <div className="bg-amber-50 text-amber-700 px-3 py-1 border border-amber-100 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Review: {reviewCount}</span>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1 border border-indigo-150/40 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Unstudied: {unstudiedCount}</span>
          </div>
        </div>
      </div>

      {/* Generator Form row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-slate-50 border border-slate-200 p-4 rounded-2xl items-end">
        <div className="md:col-span-5 space-y-1 text-left">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              const subChaps = chapters.filter(c => c.subjectId === e.target.value);
              setChapterId(subChaps[0]?.id || "");
            }}
            className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-5 space-y-1 text-left">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Choose Topic / Chapter</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="w-full text-xs px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden"
          >
            <option value="">-- All Chapters --</option>
            {activeSubjectChapters.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={triggerGenerateAI}
          disabled={isGenerating || subjects.length === 0}
          id="btn-gen-cards"
          className="md:col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold py-2 rounded-xl h-[36px] flex items-center justify-center gap-1 transition cursor-pointer shadow-xs font-mono"
        >
          {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>Generate</span>
        </button>
      </div>

      {/* Cards Slider Arena */}
      {flashcards.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-6 relative" id="flashcard-deck-slider">
          
          {/* Card Flippable Window with 3D Transforms */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-md h-64 cursor-pointer relative group [perspective:1000px] select-none"
            id="active-flippable-card"
          >
            <motion.div
              className="w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d]"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front side Card */}
              <div className="absolute inset-0 w-full h-full p-6 bg-radial from-white to-slate-50 border border-slate-250 shadow-md rounded-3xl flex flex-col justify-between [backface-visibility:hidden]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  <span>Topic Recall Prompt</span>
                  <span className="font-mono text-slate-400">Card {currentIndex + 1} of {flashcards.length}</span>
                </div>
                <div className="text-center py-4 flex items-center justify-center min-h-[140px]">
                  <p className="text-sm font-black text-slate-800 leading-snug">{flashcards[currentIndex].front}</p>
                </div>
                <div className="flex justify-center items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <RotateCw className="w-3.5 h-3.5 animate-spin-slow text-indigo-600" />
                  <span>Click to reveal solution</span>
                </div>
              </div>

              {/* Back side Card */}
              <div 
                className="absolute inset-0 w-full h-full p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 shadow-md rounded-3xl flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{ transform: "rotateY(1800deg)" }}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  <span>Model Solution Notebook</span>
                  <span className="font-mono text-indigo-400">Answer Explanation</span>
                </div>
                <div className="text-left py-4 flex items-center justify-center min-h-[140px] overflow-y-auto pr-1">
                  <p className="text-xs font-semibold font-sans text-slate-700 leading-relaxed whitespace-pre-wrap">{flashcards[currentIndex].back}</p>
                </div>
                <div className="flex justify-between items-center bg-white/70 px-3 py-1.5 rounded-xl border border-indigo-100 mt-2">
                  <span className="text-[10px] text-indigo-500 font-extrabold uppercase">Success Factor?</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus("need_review");
                      }}
                      className="px-2 py-0.5 text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-md cursor-pointer transition uppercase"
                      title="Keep in review rotation"
                    >
                      Hard 🔄
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus("mastered");
                      }}
                      className="px-2 py-0.5 text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer transition uppercase"
                      title="Mark as mastered!"
                    >
                      Easy ✅
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Pagination Controllers Room */}
          <div className="flex items-center gap-5 mt-6 w-full max-w-xs justify-between">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setIsFlipped(false);
                  setCurrentIndex(prev => prev - 1);
                }
              }}
              disabled={currentIndex === 0}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 rounded-xl text-xs font-bold transition flex items-center gap-1 text-slate-600 cursor-pointer"
            >
              ← Previous
            </button>
            <span className="text-xs font-bold text-slate-500 font-mono tracking-wider">
              {currentIndex + 1} / {flashcards.length}
            </span>
            <button
              onClick={() => {
                if (currentIndex < flashcards.length - 1) {
                  setIsFlipped(false);
                  setCurrentIndex(prev => prev + 1);
                }
              }}
              disabled={currentIndex === flashcards.length - 1}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 rounded-xl text-xs font-bold transition flex items-center gap-1 text-slate-600 cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 border border-dashed rounded-3xl bg-slate-50 border-slate-200 text-center text-slate-400">
          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
          <span className="text-xs block font-bold">Your flashcard vault is currently empty</span>
          <span className="text-[10px] mt-0.5 block px-6">Select parameters and click "Generate" to build flashcard deck.</span>
        </div>
      )}

      {errorStr && (
        <div className="bg-red-50 text-red-800 border border-red-100 p-3 rounded-xl text-xs flex items-center gap-2 text-left font-bold" id="flash-error-card">
          <Check className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorStr}</span>
        </div>
      )}
    </div>
  );
}
