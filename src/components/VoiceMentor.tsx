import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Mic, Volume2, Play, Pause, Square, Loader2, PlayCircle, HelpCircle, AudioLines } from "lucide-react";
import { Subject, Chapter } from "../types";

interface VoiceMentorProps {
  subjects: Subject[];
  chapters: Chapter[];
}

export default function VoiceMentor({ subjects, chapters }: VoiceMentorProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [briefingText, setBriefingText] = useState("");
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Speech controller state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1); // Default speed
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [voicesList, setVoicesList] = useState<SpeechSynthesisVoice[]>([]);

  // Filtering
  const subChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const list = window.speechSynthesis.getVoices();
        setVoicesList(list);
        if (list.length > 0 && !selectedVoiceName) {
          // Default to an English voice if possible
          const engVoice = list.find(v => v.lang.startsWith("en-") || v.name.includes("Google") || v.name.includes("Natural"));
          setSelectedVoiceName(engVoice?.name || list[0].name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSubjectChange = (id: string) => {
    setSelectedSubjectId(id);
    const matched = chapters.filter(c => c.subjectId === id);
    setSelectedChapterId(matched[0]?.id || "");
    setBriefingText("");
    handleStopSpeech();
  };

  const handleGenerateBriefing = async () => {
    const activeSub = subjects.find(s => s.id === selectedSubjectId);
    const activeChap = chapters.find(c => c.id === selectedChapterId);

    if (!activeSub || !activeChap) return;

    handleStopSpeech();
    setLoadingBriefing(true);
    setBriefingText("");

    try {
      const response = await fetch("/api/ai/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSub.name,
          chapter: activeChap.title
        })
      });

      if (!response.ok) throw new Error("Failed to construct audio script");
      const data = await response.json();
      
      // Prompt edit to make notes more conversational for text-to-speech
      const cleanMarkdown = data.markdown || "";
      const readableText = cleanMarkdown
        .replace(/[#*`~_]/g, "") // strip markdown codes
        .replace(/📌/g, "Core concept indicator: ")
        .replace(/📐/g, "Key Formula derivation: ")
        .replace(/💡/g, "Study active-recall hint: ")
        .substring(0, 1500); // limit spoken length so comfortable readout
        
      setBriefingText(
        `Hello Jami. Let's do a fast auditory briefing review on the chapter, ${activeChap.title}. Here is what you need to focus on. ${readableText}. Happy studying!`
      );
    } catch (e: any) {
      setBriefingText(
        `Hello Jami, I was preparing your audio tutorial for ${activeChap.title} of ${activeSub.name}, but there was a retrieval issue. Let's cover key concepts of this topic. Remember to maintain structured focus intervals and review definitions thoroughly.`
      );
    } finally {
      setLoadingBriefing(false);
    }
  };

  const handleStartSpeech = () => {
    if (!synthRef.current || !briefingText) return;

    synthRef.current.cancel(); // Stop current speech first

    const utterance = new SpeechSynthesisUtterance(briefingText);
    
    // Config voice
    const activeVoice = voicesList.find(v => v.name === selectedVoiceName);
    if (activeVoice) {
      utterance.voice = activeVoice;
    }

    utterance.rate = speechRate;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error(e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    setIsPaused(false);
    synthRef.current.speak(utterance);
  };

  const handlePauseResume = () => {
    if (!synthRef.current) return;
    
    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    } else {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleStopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="voice-mentor-panel">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
          <span>Neuro-Linguistic Audio Briefs</span>
        </span>
        <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">AI Voice Mentor & spoken briefings</h2>
        <p className="text-slate-400 text-xs">Convert syllabus summaries into high-comprehension audio lectures. Listen on-demand with offline playback controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dropdowns */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Choose Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Choose Chapter</label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
          >
            <option value="" disabled>-- Choose Chapter --</option>
            {subChapters.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spoken voice profile selectors & Speed Controller */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl" id="voice-adjustment-block">
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Lecturer Voice Profile</label>
          <select
            value={selectedVoiceName}
            onChange={(e) => setSelectedVoiceName(e.target.value)}
            className="w-full text-[11px] px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden bg-white font-bold"
          >
            {voicesList.length === 0 ? (
              <option>Default Local System Voice</option>
            ) : (
              voicesList.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))
            )}
          </select>
        </div>

        {/* Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-extrabold text-slate-400">
            <span>Lecture Speed Rate</span>
            <span className="text-indigo-600 font-mono text-[10px]">{speechRate}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speechRate}
            onChange={(e) => {
              setSpeechRate(Number(e.target.value));
              if (isSpeaking) {
                // Instantly re-start to apply rate
                setTimeout(() => handleStartSpeech(), 100);
              }
            }}
            className="w-full accent-indigo-600 cursor-pointer mt-1"
            title="Readout Speed Rate"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1" id="voice-compile-row">
        <button
          type="button"
          onClick={handleGenerateBriefing}
          disabled={loadingBriefing || !selectedChapterId}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-black px-5 py-3 rounded-2xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {loadingBriefing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>AI drafting voice synthesis script...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Compile Spoken Audio Briefing</span>
            </>
          )}
        </button>
      </div>

      {/* Briefing text playback module interface */}
      {briefingText && (
        <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50" id="lecture-playback-deck">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
            <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">Audio Player controls</h4>
            
            {/* Playback action group */}
            <div className="flex items-center gap-2" id="play-action-controls-deck">
              {!isSpeaking ? (
                <button
                  type="button"
                  onClick={handleStartSpeech}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Briefing</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePauseResume}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>{isPaused ? "Resume" : "Pause"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStopSpeech}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Snyc sound bar animation */}
          {isSpeaking && !isPaused && (
            <div className="flex items-center justify-center gap-1.5 py-1" id="soundwave-bar-animation">
              {[1, 2, 3, 4, 5, 4, 3, 2, 5, 3, 4, 1].map((h, i) => (
                <span
                  key={i}
                  className={`w-0.5 bg-indigo-600 rounded-full animate-bounce`}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: `${h * 4}px`,
                    animationDuration: "0.8s"
                  }}
                ></span>
              ))}
              <span className="text-[9px] font-extrabold text-indigo-600 font-mono tracking-widest uppercase ml-2 animate-pulse">Lecuring Active</span>
            </div>
          )}

          <div className="bg-white border border-slate-200/80 p-4 rounded-xl text-xs text-slate-600 font-medium leading-relaxed max-h-36 overflow-y-auto italic">
            "{briefingText}"
          </div>
        </div>
      )}
    </div>
  );
}
