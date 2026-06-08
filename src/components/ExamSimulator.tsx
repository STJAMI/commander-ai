import React, { useState, useEffect, useRef } from "react";
import { Sparkles, HelpCircle, Flame, Clock, Award, ShieldAlert, CheckCircle2, XCircle, ArrowRight, RefreshCw, Loader2, Play } from "lucide-react";
import { Subject } from "../types";

interface ExamSimulatorProps {
  subjects: Subject[];
}

interface SimulatedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; // e.g. "0"
  explanation: string;
}

export default function ExamSimulator({ subjects }: ExamSimulatorProps) {
  const [selectedSubjectName, setSelectedSubjectName] = useState(subjects[0]?.name || "");
  const [examFormat, setExamFormat] = useState<"SAT" | "AP_prep" | "HSC_board" | "GCSE" | "General">("SAT");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(3);

  // Simulation Active states
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);
  const [paperQuestions, setPaperQuestions] = useState<SimulatedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  
  // Timer states
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Result state
  const [showScorecard, setShowScorecard] = useState(false);

  // Format map
  const formatLabel = {
    SAT: "SAT Style MCQ paper",
    AP_prep: "AP Prep Standard MCQ",
    HSC_board: "HSC Board MCQ Series",
    GCSE: "GCSE Revision Diagnostic",
    General: "General Academic Review Quiz"
  }[examFormat];

  // Start exam pipeline
  const handleStartExam = async () => {
    if (!selectedSubjectName) return;
    setIsLoadingPaper(true);
    setPaperQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsTimeUp(false);
    setShowScorecard(false);

    try {
      const res = await fetch("/api/ai/exam-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubjectName,
          format: formatLabel,
          numQuestions: numQuestions
        })
      });

      if (!res.ok) throw new Error("Failed to consult test generator");
      const data = await res.json();
      
      if (data.questions && data.questions.length > 0) {
        setPaperQuestions(data.questions);
        setSecondsRemaining(timeLimitMinutes * 60);
        setIsSimulating(true);
      } else {
        throw new Error("Returned questions block was empty");
      }
    } catch (e: any) {
      console.error(e);
      // Fallback local questions injection
      const fallbackQuestions: SimulatedQuestion[] = [
        {
          id: "f_q1",
          question: `Which fundamental principle is absolutely central to the study of '${selectedSubjectName}'?`,
          options: ["First Law of Thermodynamics", "Theoretical conservation vectors", "Scientific method observation", "Standard analytical parity principles"],
          correctAnswer: "2",
          explanation: "All core scientific syllabuses depend directly on observations parsed by the scientific method framework."
        },
        {
          id: "f_q2",
          question: `What is a common pitfall/examiner trap when solving complex derivations in '${selectedSubjectName}'?`,
          options: ["Ignoring initial dimensions and signage consistency", "Failing to convert standard SI units", "Applying linear approximations improperly", "All of the above"],
          correctAnswer: "3",
          explanation: "Examiners commonly trap students using unit shifts, vector polarity, and algebraic boundary assumptions."
        }
      ];
      setPaperQuestions(fallbackQuestions.slice(0, numQuestions));
      setSecondsRemaining(timeLimitMinutes * 60);
      setIsSimulating(true);
    } finally {
      setIsLoadingPaper(false);
    }
  };

  // Timer trigger
  useEffect(() => {
    if (isSimulating && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimeUp(true);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, secondsRemaining]);

  const handleSelectOption = (optIdx: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIdx]: optIdx
    }));
  };

  const handleNextQuestion = () => {
    if (currentIdx < paperQuestions.length - 1) {
      setCurrentIdx(px => px + 1);
    } else {
      handleSubmitExam();
    }
  };

  const handleSubmitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSimulating(false);
    setShowScorecard(true);
  };

  // Score stats
  const calculateScore = () => {
    let score = 0;
    paperQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    return score;
  };

  const scoreCount = calculateScore();
  const percentageScore = paperQuestions.length > 0 
    ? Math.round((scoreCount / paperQuestions.length) * 100) 
    : 0;

  // Render timer nicely
  const formatTimeSeconds = (sec: number) => {
    const minStr = Math.floor(sec / 60).toString().padStart(2, "0");
    const secStr = (sec % 60).toString().padStart(2, "0");
    return `${minStr}:${secStr}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="exam-simulator-workspace">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Real-time Examination Sandbox</span>
        </span>
        <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">Timed Exam Simulator</h2>
        <p className="text-slate-400 text-xs">Configure exam types with strict countdown boundaries to diagnose performance levels under pressure.</p>
      </div>

      {!isSimulating && !showScorecard && (
        <div className="space-y-5" id="sim-setup-block">
          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Subject Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Choose Subject</label>
              <select
                value={selectedSubjectName}
                onChange={(e) => setSelectedSubjectName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Exam Standards Format */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Syllabus Standard Format</label>
              <select
                value={examFormat}
                onChange={(e) => setExamFormat(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
              >
                <option value="SAT">🇺🇸 SAT Prep Paper</option>
                <option value="AP_prep">🎓 AP Exam Standard</option>
                <option value="HSC_board">🇧🇩 HSC Board Mock</option>
                <option value="GCSE">🇬🇧 GCSE Revision Focus</option>
                <option value="General">📚 General Quizzer</option>
              </select>
            </div>

            {/* No of Questions */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">MCQ Question Count</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
              >
                <option value={3}>3 Questions (Express)</option>
                <option value={5}>5 Questions (Optimal)</option>
                <option value={10}>10 Questions (Complete Exam)</option>
              </select>
            </div>

            {/* Timers */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Strict Timer Limit</label>
              <select
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
              >
                <option value={2}>2 Minutes (Blitz Mode)</option>
                <option value={3}>3 Minutes (Moderate)</option>
                <option value={5}>5 Minutes (Extended)</option>
                <option value={10}>10 Minutes (Thorough Exam)</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end pt-1" id="exam-start-banner-row">
            <button
              type="button"
              onClick={handleStartExam}
              disabled={isLoadingPaper || !selectedSubjectName}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-slate-200 text-white text-xs font-black px-6 py-3 rounded-2xl transition duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              {isLoadingPaper ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Configuring Mock Simulator...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Simulating timed quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Ticking Simulating Window */}
      {isSimulating && paperQuestions.length > 0 && (
        <div className="space-y-5" id="sim-ticking-panel">
          {/* Diagnostic Stats Header */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Standard</p>
              <h4 className="text-xs font-extrabold text-slate-800">{formatLabel}</h4>
            </div>

            {/* Timer circle badge */}
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 pl-3.5 pr-4 py-2 rounded-xl text-indigo-700">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-black font-mono leading-none">{formatTimeSeconds(secondsRemaining)}</span>
            </div>
          </div>

          {/* Question card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <span className="bg-indigo-600 text-white font-mono font-extrabold px-2 py-0.5 rounded-md text-[10px] leading-tight">
                {currentIdx + 1} / {paperQuestions.length}
              </span>
              <p className="text-xs font-black text-slate-800 leading-snug">{paperQuestions[currentIdx].question}</p>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 gap-2 pt-1" id="choices-block-parent">
              {paperQuestions[currentIdx].options.map((opt, oIdx) => {
                const optStr = oIdx.toString();
                const isSelected = selectedAnswers[currentIdx] === optStr;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(optStr)}
                    className={`w-full text-left p-3.5 border rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation panel */}
          <div className="flex justify-between items-center" id="simulator-quiz-nav">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(p => p - 1)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNextQuestion}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
            >
              <span>{currentIdx === paperQuestions.length - 1 ? "Submit Exam" : "Next Question"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Scorecard Results Overlay and descriptive reviews */}
      {showScorecard && paperQuestions.length > 0 && (
        <div className="space-y-6" id="sim-scorecard-panel">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-indigo-600" />
            </div>
            
            <h3 className="text-base font-black text-slate-800 tracking-tight">Standardized Scorecard</h3>
            <p className="text-slate-400 text-xs mt-0.5">Performance assessment for {selectedSubjectName}</p>

            {/* Score circle */}
            <div className="my-5 inline-block">
              <div className="flex flex-col items-center justify-center bg-white border border-slate-200 shadow-xs rounded-3xl p-6 w-36 h-36 mx-auto">
                <span className="text-3xl font-black text-indigo-600 leading-none">{percentageScore}%</span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1.5 font-mono tracking-widest">
                  {scoreCount} / {paperQuestions.length} Correct
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-1" id="scorecard-pills-row">
              <button
                type="button"
                onClick={handleStartExam}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-xl transition cursor-pointer"
              >
                🔄 Try Different Paper
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowScorecard(false);
                  setPaperQuestions([]);
                }}
                className="border border-slate-200 bg-white text-slate-600 text-[10px] font-extrabold px-3.5 py-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                ⚙️ Exit Simulation
              </button>
            </div>
          </div>

          {/* Itemized Analysis with correct explanations */}
          <div className="space-y-4" id="sim-item-analysis">
            <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase tracking-wider pl-1 font-mono text-slate-500">
              Diagnostic item analysis Response Key
            </h4>

            {paperQuestions.map((q, idx) => {
              const selectedOpt = selectedAnswers[idx];
              const isCorrect = selectedOpt === q.correctAnswer;
              
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex items-start gap-2.5">
                      <span className="text-[10px] font-mono font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md mt-0.5 shrink-0">
                        Q{idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-800 leading-normal">{q.question}</p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isCorrect ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          CORRECT
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 font-mono">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          INCORRECT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Picked answers */}
                  <div className="text-[10px] text-slate-500 space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 font-mono">
                    <p>
                      <span className="font-extrabold text-slate-400">Jami's Response:</span>{" "}
                      <span className={isCorrect ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                        {selectedOpt !== undefined ? q.options[Number(selectedOpt)] : "[No option selected - Timer Limit Expired]"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        <span className="font-extrabold text-slate-400">Correct Response:</span>{" "}
                        <span className="text-emerald-700 font-bold font-mono">
                          {q.options[Number(q.correctAnswer)]}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Descriptive walkthrough explanation */}
                  <div className="text-slate-600 text-[11px] leading-normal font-medium bg-indigo-50/20 p-3 border-l-2 border-indigo-500 rounded-r-xl">
                    <span className="font-black text-indigo-600 block text-[10px] uppercase font-mono tracking-wide mb-1 leading-none">Master tutor breakdown:</span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
