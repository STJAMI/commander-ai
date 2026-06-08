import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Bot, User, Trash2, HelpCircle, GraduationCap, ArrowRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const PRESET_PILLS = [
  "Explain Kepler's 3rd Law using analogies",
  "How do complex numbers apply in real physics?",
  "List high-yielding questions for Newtonian Mechanics",
  "Quick summary of TCP protocol vs UDP"
];

export default function AIStudyChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("study_commander_chat_messages");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "m_init",
        sender: "bot",
        text: "Hi Jami! 🎓 I'm your **AI Study Academy Assistant**. Ask me any question from your syllabus, paste tricky exam problems, or ask me to draft conceptual summaries. Type your question below or click a quick prompt to start!",
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("study_commander_chat_messages", JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: Message = {
      id: "u_" + Math.random().toString(),
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend.trim() })
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to fetch response");
      }

      const data = await res.json();
      const botMsg: Message = {
        id: "b_" + Math.random().toString(),
        sender: "bot",
        text: data.responseText,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      // Fallback response so they are never stuck
      const errorMsg: Message = {
        id: "b_err_" + Math.random().toString(),
        sender: "bot",
        text: `Sorry, Jami. My online academic brain is sync-testing. Here is a conceptual response related to **"${textToSend}"**:

Your study query highlights a crucial milestone.
- **Tip**: Check your Subject Manager to ensure relevant syllabus hours are scheduled.
- **Study Guide**: Review the "Smart Flashcards" tab to practice active recall on this immediately!`,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Do you want to reset your conversation log?")) {
      setMessages([
        {
          id: "m_init",
          sender: "bot",
          text: "Hi Jami! 🎓 Conversation history reset. Ask me anything about your current physics lectures or coding paradigms to study perfectly!",
          timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  };

  // Helper inside bubbles to format bold strings safely
  const formatText = (txt: string) => {
    return txt.split("\n").map((line, lIdx) => {
      // Very simple parsing of double asterisks for bolding
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-slate-900 font-extrabold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <span key={lIdx} className="block min-h-[4px]">
          {parts.length > 0 ? parts : line}
        </span>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[520px] justify-between" id="ai-chat-assistant-section">
      
      {/* Upper bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-none">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-650 animate-pulse" />
          <div className="text-left">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">AI Conversational Study Help</h3>
            <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase tracking-wider block">Real-time Tutor</span>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1 px-2.5 text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50 transition border border-transparent rounded-lg flex items-center gap-1 font-bold tracking-tight cursor-pointer"
          title="Reset tutor chat logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages Arena */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-left scrollbar-thin scrollbar-thumb-slate-200" id="chat-messages-container">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-xs select-none ${
                m.sender === "user" ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`rounded-3xl p-4 text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-indigo-500 text-white rounded-tr-none font-medium selection:bg-indigo-200 selection:text-indigo-900"
                  : "bg-slate-50 border border-slate-205 text-slate-750 rounded-tl-none font-semibold"
              }`}>
                <div className="space-y-1.5">{formatText(m.text)}</div>
                <span className={`block text-[9px] mt-2 font-mono ${m.sender === "user" ? "text-indigo-200 text-right" : "text-slate-400"}`}>
                  {m.timestamp}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isSending && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-150 border text-slate-700 border-slate-200">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-slate-50 border border-slate-205 rounded-xl rounded-tl-none p-3.5 text-xs flex items-center gap-2.5 font-bold text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>AI Study Commander is writing response...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestion pills block */}
      <div className="flex-none pt-2">
        <div className="flex items-center gap-1 mb-2 px-1">
          <Sparkles className="w-3 h-3 text-amber-500 animate-spin-slow" />
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Suggestion Queries</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1 pb-1">
          {PRESET_PILLS.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(pill)}
              disabled={isSending}
              className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1.5 rounded-full transition text-left cursor-pointer font-bold whitespace-nowrap"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-none"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
          placeholder="Ask a question about Newton's laws, Kepler's planetary motion, complex integration..."
          className="flex-1 text-xs border border-slate-205 rounded-full px-4 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-45 text-white rounded-full transition cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
