import React, { useState, useEffect, useRef } from "react";
import { Search, Sparkles, BookOpen, Calendar, HelpCircle, LayoutDashboard, Brain, Compass, Bot, FileText, Plus, CheckSquare, Keyboard, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Subject, Chapter } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  subjects: Subject[];
  chapters: Chapter[];
  onAddTask: (title: string, subjectId: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  subjects,
  chapters,
  onAddTask
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setQuickAddMode(false);
      setTaskTitle("");
      if (subjects.length > 0) {
        setSelectedSubjectId(subjects[0].id);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, subjects]);

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Palette command commands
  const navigationCommands = [
    { id: "dashboard", label: "Go to Dashboard", category: "Navigation", icon: <LayoutDashboard className="w-4 h-4" />, action: () => setActiveTab("dashboard") },
    { id: "syllabus", label: "Go to Subject Manager & Syllabus", category: "Navigation", icon: <BookOpen className="w-4 h-4" />, action: () => setActiveTab("syllabus") },
    { id: "planner", label: "Go to Study Planner & Routine", category: "Navigation", icon: <Calendar className="w-4 h-4" />, action: () => setActiveTab("planner") },
    { id: "academy", label: "Go to Smart Flashcards & Quizzer", category: "Navigation", icon: <HelpCircle className="w-4 h-4" />, action: () => setActiveTab("academy") },
    { id: "twin", label: "Consult AI Study Twin", category: "AI Innovation Lab", icon: <Bot className="w-4 h-4" />, action: () => setActiveTab("twin") },
    { id: "memory", label: "Inspect Memory Decay Curve", category: "AI Innovation Lab", icon: <Brain className="w-4 h-4" />, action: () => setActiveTab("memory") },
    { id: "notes", label: "Generate Auto Note Sheets", category: "AI Innovation Lab", icon: <FileText className="w-4 h-4" />, action: () => setActiveTab("notes") },
    { id: "career", label: "Navigate Career Pathways", category: "AI Innovation Lab", icon: <Compass className="w-4 h-4" />, action: () => setActiveTab("career") }
  ];

  // Helper mode toggle for quick tasks creation
  const taskCommand = { id: "quick-add-task", label: "Quick Create Planner Task...", category: "Productivity", icon: <Plus className="w-4 h-4 text-emerald-500" />, action: () => setQuickAddMode(true) };

  // Filter list
  const allChoices = [taskCommand, ...navigationCommands];
  const filteredChoices = allChoices.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation inside custom palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (quickAddMode ? 1 : filteredChoices.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (quickAddMode ? 1 : filteredChoices.length)) % (quickAddMode ? 1 : filteredChoices.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (quickAddMode) {
          handleCreateTask();
        } else if (filteredChoices[selectedIndex]) {
          filteredChoices[selectedIndex].action();
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, selectedIndex, filteredChoices, quickAddMode, taskTitle, selectedSubjectId]);

  function handleCreateTask() {
    if (!taskTitle.trim()) return;
    onAddTask(taskTitle, selectedSubjectId);
    setTaskTitle("");
    setQuickAddMode(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 text-slate-800" id="command-palette-backdrop">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[480px]"
        id="command-palette-dialog"
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50" id="command-palette-header">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <Keyboard className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span>Interactive Space Control</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
            id="btn-close-palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Block */}
        {!quickAddMode ? (
          <div className="relative border-b border-slate-100" id="palette-search-container">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search workspaces or type action (e.g. 'Planner', 'Quiz')..."
              className="w-full text-sm text-slate-800 bg-transparent pl-12 pr-6 py-4 focus:outline-hidden font-medium"
              id="command-palette-search"
            />
          </div>
        ) : (
          <div className="p-5 border-b border-slate-100 bg-emerald-50/10 space-y-4 text-left" id="palette-quick-add-container">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Quick Task Architect</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Review Newtonian Physics equations..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 select-all p-2.5 rounded-xl text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  id="palette-task-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Associated Subject Track</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-hidden"
                  id="palette-subject-select"
                >
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                  {subjects.length === 0 && (
                    <option value="">No Course Track Registered</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-lg transition shadow-md cursor-pointer"
                  id="palette-submit-task"
                >
                  Confirm & Add Task
                </button>
                <button
                  onClick={() => setQuickAddMode(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition"
                  id="palette-cancel-task"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic choices list */}
        {!quickAddMode && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin" id="palette-choices-list">
            {filteredChoices.map((choice, i) => {
              const isActive = selectedIndex === i;
              return (
                <div
                  key={choice.id}
                  onClick={() => {
                    choice.action();
                    if (choice.id !== "quick-add-task") {
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-100 ${
                    isActive 
                      ? "bg-indigo-50 border border-indigo-100 text-indigo-900" 
                      : "hover:bg-slate-50 border border-transparent text-slate-600"
                  }`}
                  id={`palette-choice-item-${choice.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg border ${isActive ? 'bg-indigo-100/50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {choice.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold leading-tight block">{choice.label}</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mt-0.5">{choice.category}</span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="text-[10px] font-extrabold text-indigo-500 font-mono tracking-tight bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 animate-pulse">
                      ENTER Key
                    </span>
                  )}
                </div>
              );
            })}

            {filteredChoices.length === 0 && (
              <div className="py-12 text-center" id="palette-empty-choices">
                <Keyboard className="w-8 h-8 text-slate-300 mx-auto opacity-70 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No system shortcuts match your query.</p>
                <p className="text-[10px] text-slate-400 mt-1">Try typing "Go" or "Task".</p>
              </div>
            )}
          </div>
        )}

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold" id="palette-footer-guide">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div>
            <span>ESC to Dismiss</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
