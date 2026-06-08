import React, { useState } from "react";
import { Sparkles, Bot, GraduationCap, Flame, BrainCircuit, RefreshCw, Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Subject, Chapter } from "../types";

interface AITwinProps {
  subjects: Subject[];
  chapters: Chapter[];
}

interface ChatMessage {
  role: "user" | "twin";
  text: string;
  time: string;
}

export default function AITwin({ subjects, chapters }: AITwinProps) {
  const [twinType, setTwinType] = useState<"studious" | "rebel" | "auditor">("studious");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: "twin",
      text: "Hey! I'm your digital Study Twin. I track your progress and think just like a peer. Sync my memory anytime or ask me dynamic syllabus questions!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);

  const completedChapters = chapters.filter(c => c.status === "completed").map(c => {
    const sub = subjects.find(s => s.id === c.subjectId);
    return {
      title: c.title,
      subject: sub ? sub.name : "Unknown Study"
    };
  });

  const handleSyncMemory = () => {
    const memoryCount = completedChapters.length;
    const countText = memoryCount === 1 ? "1 completed chapter" : `${memoryCount} completed chapters`;
    
    setMessages(prev => [
      ...prev,
      {
        role: "twin",
        text: `🧠 Memory Sync complete! I have absorbed your progress across ${countText}. I'm fully aligned with your current syllabus footprint! Ask me anything about what we've completed.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userText = chatInput;
    setChatInput("");
    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setLoading(true);

    try {
      // Map current messages to history format
      const history = messages.slice(1).map(m => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text
      }));

      const res = await fetch("/api/ai/twin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history,
          twinType,
          completedChapters
        })
      });

      if (!res.ok) {
        throw new Error("Failed to chat with twin");
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: "twin",
          text: data.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: "twin",
          text: `⚠️ Hey Jami, I had a quick sync blip: ${err.message || "Could not connect."} Let me know if we should try again!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="ai-twin-workspace">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          <span>Active Cognitive Replication</span>
        </span>
        <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">AI Study Twin</h2>
        <p className="text-slate-400 text-xs">Chat with an interactive digital reflection of yourself trained on your syllabus progress.</p>
      </div>

      {/* Profile/Config Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="twin-personas-container">
        {/* Personality 1 */}
        <button
          type="button"
          onClick={() => setTwinType("studious")}
          className={`p-4 border rounded-2xl text-left scale-100 transition hover:scale-[1.02] cursor-pointer ${
            twinType === "studious"
              ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
              : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${twinType === "studious" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-slate-800">Elite Scholar</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">Obsessed with productivity scorecards, optimal notes recall, and tracking countdowns strictly.</p>
        </button>

        {/* Personality 2 */}
        <button
          type="button"
          onClick={() => setTwinType("rebel")}
          className={`p-4 border rounded-2xl text-left scale-100 transition hover:scale-[1.02] cursor-pointer ${
            twinType === "rebel"
              ? "border-amber-500 bg-amber-50/40 shadow-xs"
              : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${twinType === "rebel" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"}`}>
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-slate-800">Rebel Thinker</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">Masters topics from foundational formulas first-principles without getting exhausted by busywork.</p>
        </button>

        {/* Personality 3 */}
        <button
          type="button"
          onClick={() => setTwinType("auditor")}
          className={`p-4 border rounded-2xl text-left scale-100 transition hover:scale-[1.02] cursor-pointer ${
            twinType === "auditor"
              ? "border-rose-500 bg-rose-50/40 shadow-xs"
              : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${twinType === "auditor" ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-600"}`}>
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-slate-800">Examiner Auditor</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">Asks rigorous exam proof questions. Meticulous, logical, and constantly checks for pitfalls.</p>
        </button>
      </div>

      {/* Sync State Banner */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 font-extrabold text-sm font-mono">
            {completedChapters.length}
          </span>
          <p className="text-xs font-bold text-slate-700">Completed Syllabus Anchors inside Memory Tree</p>
        </div>
        <button
          type="button"
          onClick={handleSyncMemory}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Sync Twin Memory
        </button>
      </div>

      {/* Chat Area */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30 flex flex-col h-80" id="twin-chat-block">
        <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              {twinType === "studious" ? "Study Twin (Scholar)" : twinType === "rebel" ? "Study Twin (Rebel)" : "Study Twin (Examiner)"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Synchronized</span>
        </div>

        {/* Message logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none self-end"
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-none self-start shadow-2xs"
              }`}
            >
              <p className="whitespace-pre-wrap font-medium">{m.text}</p>
              <span className={`block text-[8px] mt-1 text-right  ${m.role === "user" ? "text-indigo-200" : "text-slate-400"}`}>
                {m.time}
              </span>
            </div>
          ))}

          {loading && (
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none self-start flex items-center gap-2 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span className="text-[10px] font-extrabold text-slate-400 animate-pulse uppercase tracking-widest">Replicating thoughts...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={loading}
            placeholder={loading ? "Let me complete this thought first..." : `Ask your ${twinType} Study Twin about formulas, advice, or ideas...`}
            className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/20"
          />
          <button
            type="submit"
            disabled={loading || !chatInput.trim()}
            className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-full flex items-center justify-center transition duration-150 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
