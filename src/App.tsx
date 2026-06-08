import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Calendar, HelpCircle, LayoutDashboard, Sparkles, User, LogOut, Code, AlertTriangle, Brain, Compass, Bot, FileText, Volume2, Award, Search, Keyboard, Menu, X } from "lucide-react";
import { Subject, Chapter, Task, QuizResult, SpacedRepetitionItem } from "./types";
import { auth, loginWithGoogle, logout, onAuthStateChanged, FirebaseUser } from "./utils/firebase";

// Import modular sub-components
import Pomodoro from "./components/Pomodoro";
import Dashboard from "./components/Dashboard";
import SubjectManager from "./components/SubjectManager";
import StudyPlanner from "./components/StudyPlanner";
import AIStudyAcademy from "./components/AIStudyAcademy";
import CelebrationOverlay from "./components/CelebrationOverlay";
import LandingPage from "./components/LandingPage";
import OnboardingGuide from "./components/OnboardingGuide";
import AchievementsShowcase from "./components/AchievementsShowcase";
import { useSystemThemeSuggestion } from "./hooks/useSystemThemeSuggestion";
import CommandPalette from "./components/CommandPalette";

// Import AI-Study Companion sub-modules
import AITwin from "./components/AITwin";
import MemoryEngine from "./components/MemoryEngine";
import AutoNotes from "./components/AutoNotes";
import ExamSimulator from "./components/ExamSimulator";
import VoiceMentor from "./components/VoiceMentor";
import CareerNavigator from "./components/CareerNavigator";

// Pre-populated realistic initial syllabus mocks for Jami
const INITIAL_SUBJECTS: Subject[] = [
  { id: "s1", name: "Physics 1st Paper", color: "#4F46E5" },
  { id: "s2", name: "Physics 2nd Paper", color: "#2563EB" },
  { id: "s3", name: "Math 2nd Paper", color: "#7C3AED" },
  { id: "s4", name: "ICT", color: "#0D9488" },
  { id: "s5", name: "English", color: "#E11D48" },
];

const INITIAL_CHAPTERS: Chapter[] = [
  { id: "c1", subjectId: "s1", title: "Chapter 1: Physical World and Measurement", difficulty: "Easy", status: "completed", estimatedHours: 2, completionDate: "2026-06-05T12:00:00Z" },
  { id: "c2", subjectId: "s1", title: "Chapter 2: Vectors", difficulty: "Medium", status: "completed", estimatedHours: 4, completionDate: "2026-06-06T14:30:00Z" },
  { id: "c3", subjectId: "s1", title: "Chapter 3: Dynamics", difficulty: "Medium", status: "completed", estimatedHours: 4, completionDate: "2026-06-07T16:00:00Z" },
  { id: "c4", subjectId: "s1", title: "Chapter 4: Newtonian Mechanics", difficulty: "Hard", status: "not_started", estimatedHours: 6 },
  { id: "c5", subjectId: "s1", title: "Chapter 5: Work, Energy & Power", difficulty: "Medium", status: "in_progress", estimatedHours: 5 },
  { id: "c6", subjectId: "s3", title: "Chapter 3: Complex Numbers", difficulty: "Medium", status: "completed", estimatedHours: 5, completionDate: "2026-06-04T10:00:00Z" },
  { id: "c7", subjectId: "s3", title: "Chapter 4: Quadratic Equations", difficulty: "Hard", status: "in_progress", estimatedHours: 6 },
  { id: "c8", subjectId: "s4", title: "Chapter 3: Communication Systems", difficulty: "Medium", status: "completed", estimatedHours: 4, completionDate: "2026-06-07T11:00:00Z" },
];

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Newtonian Mechanics Formula sheet drafting", completed: true, priority: 1, deadline: "2026-06-08" },
  { id: "t2", title: "Review Complex number Euler proofs", completed: false, priority: 2, deadline: "2026-06-08" },
  { id: "t3", title: "Solve ICT Chapter 2 Creative Question test", completed: false, priority: 2, deadline: "2026-06-09" },
  { id: "t4", title: "Completed daily English essay revision focus", completed: true, priority: 3, deadline: "2026-06-08" },
];

const INITIAL_WEEKLY_HOURS = [
  { day: "Mon", hours: 8 },
  { day: "Tue", hours: 6 },
  { day: "Wed", hours: 10 },
  { day: "Thu", hours: 4.5 },
  { day: "Fri", hours: 8 },
  { day: "Sat", hours: 9 },
  { day: "Sun", hours: 4.5 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'syllabus' | 'planner' | 'academy' | 'twin' | 'memory' | 'notes' | 'simulator' | 'mentor' | 'career'>('dashboard');

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Custom credentials or guest session persistence
  const [customProfileSession, setCustomProfileSession] = useState<{ displayName: string; email: string; isGuest: boolean } | null>(() => {
    const saved = localStorage.getItem("study_commander_custom_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    return localStorage.getItem("study_commander_landing_dismissed") !== "true";
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("study_commander_onboarding_completed") !== "true";
  });

  // Unified dynamic username derived from Google login sequence or custom session
  const displayName = currentUser 
    ? (currentUser.displayName?.split(" ")[0] || currentUser.email?.split("@")[0] || "Jami") 
    : (customProfileSession ? customProfileSession.displayName?.split(" ")[0] : "Jami");

  // Authenticate & listen to session transitions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      // Auto-bypass landing page and onboarding if logged in with real Google Account
      if (user) {
        setShowLandingPage(false);
        localStorage.setItem("study_commander_landing_dismissed", "true");
      }
    });
    return () => unsubscribe();
  }, []);

  // Load persistent states
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem("study_commander_subjects");
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem("study_commander_chapters");
    return saved ? JSON.parse(saved) : INITIAL_CHAPTERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("study_commander_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [focusMinutes, setFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("study_commander_focus_mins");
    return saved ? Number(saved) : 270; // Pre-populated 4h 30m as matching checklist
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem("study_commander_streak");
    return saved ? Number(saved) : 5;
  });

  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => {
    const saved = localStorage.getItem("study_commander_quiz_results");
    return saved ? JSON.parse(saved) : [];
  });

  const [spacedRepetitions, setSpacedRepetitions] = useState<SpacedRepetitionItem[]>(() => {
    const saved = localStorage.getItem("study_commander_repetitions");
    return saved ? JSON.parse(saved) : [];
  });

  const [weaknessDiagnostic, setWeaknessDiagnostic] = useState<any>(() => {
    const saved = localStorage.getItem("study_commander_diagnostic");
    return saved ? JSON.parse(saved) : {
      overallInsight: "You're showing consistent focus. Let's work to bring Mathematics and Physics Chapter 4 Newtonian Mechanics up to par.",
      weaknesses: [
        {
          subject: "Physics 1st Paper",
          accuracy: "58%",
          recommendedTopic: "Newtonian Mechanics Dynamics",
          planOfAction: "Review work problems and schedule a Spaced Repetition exercise session."
        }
      ]
    };
  });

  const [runningDiagnostic, setRunningDiagnostic] = useState(false);

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState("");
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const triggerCelebration = (title?: string, msg?: string) => {
    setCelebrationTitle(title || "Daily Goal Accomplished!");
    setCelebrationMessage(msg || `Superb focus level, ${displayName}! Your academic success is fully on target.`);
    setShowCelebration(true);
  };

  const [examDate, setExamDate] = useState<string>(() => {
    const saved = localStorage.getItem("study_commander_exam_date");
    return saved ? saved : "2026-06-23";
  });

  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem("study_commander_theme");
    if (saved) return saved;
    // Automatically default to Cosmic on system dark preference, Classic Slate otherwise
    if (typeof window !== "undefined" && window.matchMedia) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "cosmic" : "slate";
    }
    return "slate";
  });

  const {
    showSuggestion,
    suggestedThemeLabel,
    dismissSuggestion,
    applySuggestion,
  } = useSystemThemeSuggestion(theme, setTheme);

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem("study_commander_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("study_commander_subjects", JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem("study_commander_exam_date", examDate);
  }, [examDate]);

  useEffect(() => {
    localStorage.setItem("study_commander_chapters", JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem("study_commander_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("study_commander_focus_mins", String(focusMinutes));
  }, [focusMinutes]);

  useEffect(() => {
    localStorage.setItem("study_commander_streak", String(streakDays));
  }, [streakDays]);

  useEffect(() => {
    localStorage.setItem("study_commander_quiz_results", JSON.stringify(quizResults));
  }, [quizResults]);

  useEffect(() => {
    localStorage.setItem("study_commander_repetitions", JSON.stringify(spacedRepetitions));
  }, [spacedRepetitions]);

  useEffect(() => {
    if (weaknessDiagnostic) {
      localStorage.setItem("study_commander_diagnostic", JSON.stringify(weaknessDiagnostic));
    }
  }, [weaknessDiagnostic]);

  // Handler functions
  const handleFocusComplete = (minutes: number) => {
    setFocusMinutes(prev => prev + minutes);
    
    // Increment streak automatically if last focus was on a new day
    setStreakDays(prev => {
      const newStreak = prev + 1;
      triggerCelebration(
        "Focus Session Accomplished! 🎯",
        `Phenomenal focus, ${displayName}! You completed a ${minutes}-minute study session. Your daily focus streak is upgraded to ${newStreak} days!`
      );
      return newStreak;
    });

    // Add a priority completed task automatically dynamically as reward
    const rewardTask: Task = {
      id: Math.random().toString(),
      title: `Completed ${minutes}m Pomodoro Focus Session`,
      completed: true,
      priority: 3
    };
    setTasks(prev => [rewardTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      
      const target = prev.find(t => t.id === id);
      const isNowCompleted = target && !target.completed;
      const newDone = updated.filter(t => t.completed).length;
      const total = updated.length;
      
      if (isNowCompleted) {
        if (newDone === total && total > 0) {
          triggerCelebration(
            "All Priorities Cleared! 🔥",
            `Spectacular work, ${displayName}! You have checked off all ${total} of today's study goals. Your momentum is absolutely fantastic!`
          );
        } else {
          triggerCelebration(
            "Daily Priority Met! 🌟",
            `You successfully completed: "${target.title}"! Keep going to clear the remainder of your syllabus list.`
          );
        }
      }
      return updated;
    });
  };

  const handleAddTask = (title: string, priority: 1|2|3) => {
    const newTask: Task = {
      id: Math.random().toString(),
      title,
      completed: false,
      priority,
      deadline: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleImportAISyllabus = (
    parsedSubjects: { name: string; color: string; chapters: { title: string; difficulty: "Easy" | "Medium" | "Hard"; estimatedHours: number }[] }[],
    parsedExamDate: string,
    importMode: "merge" | "replace" = "replace"
  ) => {
    const createdSubjects: Subject[] = [];
    const createdChapters: Chapter[] = [];

    parsedSubjects.forEach((sub) => {
      const subjectId = "sub_" + Math.random().toString(36).substring(2, 9);
      createdSubjects.push({
        id: subjectId,
        name: sub.name,
        color: sub.color || "#6366F1"
      });

      sub.chapters.forEach((chap) => {
        createdChapters.push({
          id: "chap_" + Math.random().toString(36).substring(2, 9),
          subjectId: subjectId,
          title: chap.title,
          difficulty: chap.difficulty || "Medium",
          status: "not_started",
          estimatedHours: Number(chap.estimatedHours) || 4
        });
      });
    });

    if (importMode === "replace") {
      setSubjects(createdSubjects);
      setChapters(createdChapters);
    } else {
      setSubjects((prev) => {
        const filteredPrev = prev.filter(
          (p) => !createdSubjects.some((c) => c.name.toLowerCase() === p.name.toLowerCase())
        );
        return [...filteredPrev, ...createdSubjects];
      });
      setChapters((prev) => [...prev, ...createdChapters]);
    }

    if (parsedExamDate) {
      setExamDate(parsedExamDate);
    }

    // Add priority checklist task informing Jami of successful build
    const noticeTask: Task = {
      id: "notice_" + Math.random().toString(),
      title: `Review AI Planned Syllabus (${createdSubjects.length} subjects imported)`,
      completed: false,
      priority: 1,
      deadline: new Date().toISOString().split("T")[0]
    };
    setTasks((prev) => [noticeTask, ...prev]);
  };

  const handleAddSubject = (name: string, color: string) => {
    const newSub: Subject = {
      id: Math.random().toString(),
      name,
      color
    };
    setSubjects(prev => [...prev, newSub]);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setChapters(prev => prev.filter(c => c.subjectId !== id));
  };

  const handleAddChapter = (subjectId: string, title: string, difficulty: 'Easy'|'Medium'|'Hard', estimatedHours: number) => {
    const newChap: Chapter = {
      id: Math.random().toString(),
      subjectId,
      title,
      difficulty,
      status: "not_started",
      estimatedHours
    };
    setChapters(prev => [...prev, newChap]);
  };

  const handleDeleteChapter = (id: string) => {
    setChapters(prev => prev.filter(c => c.id !== id));
    setSpacedRepetitions(prev => prev.filter(r => r.chapterId !== id));
  };

  const handleUpdateChapterStatus = (id: string, status: 'not_started' | 'in_progress' | 'completed') => {
    setChapters(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated: Chapter = { ...c, status };
          if (status === "completed") {
            updated.completionDate = new Date().toISOString();
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleAddToSpacedRepetition = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    // Check if copy already exists
    if (spacedRepetitions.some(r => r.chapterId === chapterId)) return;

    const subject = subjects.find(s => s.id === chapter.subjectId);
    const completedDate = chapter.completionDate || new Date().toISOString();

    const baseTime = new Date(completedDate);
    
    // Spaced repetition interval review dates calculator: 1 day, 3 days, 7 days, 14 days
    const intervals = [1, 3, 7, 14];
    const reviews = intervals.map((days, idx) => {
      const target = new Date(baseTime);
      target.setDate(baseTime.getDate() + days);
      const stageName = (idx === 0 ? '1 Day' : idx === 1 ? '3 Days' : idx === 2 ? '7 Days' : '14 Days') as '1 Day' | '3 Days' | '7 Days' | '14 Days';
      return {
        stage: stageName,
        dueDate: target.toISOString(),
        completed: false
      };
    });

    const newItem: SpacedRepetitionItem = {
      id: Math.random().toString(),
      chapterId,
      chapterTitle: chapter.title,
      subjectName: subject ? subject.name : "Academic",
      completedDate,
      reviews
    };

    setSpacedRepetitions(prev => [newItem, ...prev]);
  };

  const handleToggleReviewCompleted = (itemId: string, stage: '1 Day' | '3 Days' | '7 Days' | '14 Days') => {
    setSpacedRepetitions(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            reviews: item.reviews.map(r => r.stage === stage ? { ...r, completed: !r.completed } : r)
          };
        }
        return item;
      })
    );
  };

  const handleClearRepetitions = () => {
    setSpacedRepetitions([]);
  };

  // Keyboard Shortcuts & Command Palette integration
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    function handleGlobalKeys(e: KeyboardEvent) {
      if (showLandingPage && !currentUser && !customProfileSession) {
        return; // Disable inside outer static landing screen
      }

      const isInput = e.target instanceof HTMLInputElement || 
                      e.target instanceof HTMLTextAreaElement || 
                      (e.target as HTMLElement).isContentEditable;

      // Ctrl+K or Cmd+K: Open/Toggle Command Palette (always allowed)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
        return;
      }

      // Ctrl+D / Alt+D: Navigation direct to Dashboard
      if (((e.ctrlKey || e.metaKey) || e.altKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setActiveTab('dashboard');
        triggerCelebration("Dashboard Shortcut ⚡", "Quick dashboard keyboard shortcut processed successfully.");
        return;
      }

      // Alt+S: Navigation to Syllabus Subject track
      if (e.altKey && e.key.toLowerCase() === 's' && !isInput) {
        e.preventDefault();
        setActiveTab('syllabus');
        return;
      }

      // Alt+P: Navigation to Study routine Planner
      if (e.altKey && e.key.toLowerCase() === 'p' && !isInput) {
        e.preventDefault();
        setActiveTab('planner');
        return;
      }

      // Alt+A: Navigation to Flashcard academy quizzer
      if (e.altKey && e.key.toLowerCase() === 'a' && !isInput) {
        e.preventDefault();
        setActiveTab('academy');
        return;
      }
    }

    window.addEventListener("keydown", handleGlobalKeys);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeys);
    };
  }, [showLandingPage, currentUser, customProfileSession, displayName]);

  const handleAddQuizResult = (res: QuizResult) => {
    setQuizResults(prev => [res, ...prev]);
  };

  // Run AI Weakness Detector dynamic diagnostic calculations
  const handleRunDiagnostic = async () => {
    setRunningDiagnostic(true);
    try {
      const activeScoreMetrics = quizResults.map(q => ({
        chapter: q.chapterTitle,
        subject: q.subjectName,
        score: q.score
      }));

      const activeSubjectList = subjects.map(s => s.name);
      const activeChaptersList = chapters.map(c => ({
        title: c.title,
        status: c.status
      }));

      const res = await fetch("/api/ai/weakness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectList: activeSubjectList,
          chapterSyllabus: activeChaptersList,
          quizScores: activeScoreMetrics
        })
      });

      if (!res.ok) {
        throw new Error("Failed to consult AI analyzer");
      }

      const data = await res.json();
      setWeaknessDiagnostic(data);
    } catch (e) {
      console.error(e);
      // Fallback local analyzer heuristic
      const completedCount = chapters.filter(c => c.status === "completed").length;
      const inProgressChapters = chapters.filter(c => c.status === "in_progress");
      
      let recommendedTopic = "Physics Newtonian Mechanics";
      let recommendedAction = "Complete some short tests on Newtonian dynamics.";
      if (inProgressChapters.length > 0) {
        recommendedTopic = inProgressChapters[0].title;
        recommendedAction = "Revise chapter formulas and mark it ready for MCQ quiz validation.";
      }

      setWeaknessDiagnostic({
        overallInsight: `Completed ${completedCount} of ${chapters.length} syllabus chapters. Let's maximize focus on outstanding topics.`,
        weaknesses: [
          {
            subject: inProgressChapters[0] 
              ? (subjects.find(s => s.id === inProgressChapters[0].subjectId)?.name || "Academic Subject")
              : "Course Review",
            accuracy: "65% Paced Accuracy",
            recommendedTopic: recommendedTopic,
            planOfAction: recommendedAction
          }
        ]
      });
    } finally {
      setRunningDiagnostic(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setAuthError(null);
      const u = await loginWithGoogle();
      triggerCelebration(
        "Welcome, " + (u.displayName?.split(" ")[0] || "User") + "! 🎯",
        "Successfully connected your Google account. Your virtual dashboard remains active."
      );
      setShowLandingPage(false);
      localStorage.setItem("study_commander_landing_dismissed", "true");
      
      if (localStorage.getItem("study_commander_onboarding_completed") !== "true") {
        setShowOnboarding(true);
      }
    } catch (e: any) {
      console.error("Google authentication failed:", e);
      const errorMsg = e?.message || e?.code || String(e);
      if (errorMsg.includes("popup-closed-by-user") || errorMsg.includes("cancelled-popup-request")) {
        setAuthError(
          "The authentication popup window was closed, cancelled, or blocked before completion."
        );
      } else {
        setAuthError(
          `Authentication failed: ${errorMsg}. Please verify your network and check that popup permissions are active.`
        );
      }
    }
  };

  const handleGuestAccess = (customUser?: { displayName: string; email: string; isGuest: boolean }) => {
    const sessionData = customUser || {
      displayName: "Guest Scholar",
      email: "guest@commander.ai",
      isGuest: true
    };
    
    setCustomProfileSession(sessionData);
    localStorage.setItem("study_commander_custom_profile", JSON.stringify(sessionData));
    
    setShowLandingPage(false);
    localStorage.setItem("study_commander_landing_dismissed", "true");
    
    setShowOnboarding(true);
    localStorage.removeItem("study_commander_onboarding_completed");
    
    triggerCelebration(
      `Welcome to the Hub, ${sessionData.displayName.split(" ")[0]}! 🎯`,
      "Your scientific course syllabus is compiled and ready for deployment."
    );
  };

  const handleCustomLogout = () => {
    setCustomProfileSession(null);
    localStorage.removeItem("study_commander_custom_profile");
    setShowLandingPage(true);
    localStorage.setItem("study_commander_landing_dismissed", "false");
    triggerCelebration("Signed Out Successfully", "Your guest workspace session has been cleared.");
  };

  if (showLandingPage && !currentUser && !customProfileSession) {
    return (
      <LandingPage 
        onSignInWithGoogle={handleSignInWithGoogle}
        onGuestAccess={handleGuestAccess}
        isLoading={authLoading}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased text-slate-900 theme-${theme}`}>
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-xs" id="app-header-bar">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Responsive Hamburger Navigation trigger */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer transition shadow-xs"
              title="Open Workspace Menu"
              id="header-mobile-menu-trigger"
            >
              <Menu className="w-4 h-4" />
            </button>

            <motion.div 
              whileHover={{ scale: 1.03, y: -0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-slate-50 hover:shadow-xs border border-transparent hover:border-slate-100/80 transition-all duration-300"
              id="header-app-logo"
            >
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 block leading-tight">Commander Terminal</span>
                <h1 className="text-base font-extrabold tracking-tight text-slate-800">Commander.ai</h1>
              </div>
            </motion.div>

            {/* Quick Command Palette Trigger (Search icon & key combination indicator) */}
            <button
               onClick={() => setIsPaletteOpen(true)}
               className="hidden sm:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-400 font-bold cursor-pointer transition ml-4 shadow-sm hover:shadow-xs"
               title="Open command terminal search palette (Ctrl+K)"
               id="header-palette-search-trigger"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500 font-bold shrink-0">Search Spaces...</span>
              <span className="text-[9px] font-extrabold font-mono tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">
                ⌘K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Elegant multi-theme selector pill */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 pl-2.5 pr-3 py-1.5 rounded-full shadow-sm" id="theme-selector-bubble">
              <svg className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3.03a1.962 1.962 0 01-1.453-.625L12 10.828a2 2 0 00-3.414-1.414l-1.414 1.414a2 2 0 002.828 2.828l1.414-1.414"></path>
              </svg>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-transparent text-[11px] font-extrabold text-slate-600 focus:outline-hidden cursor-pointer tracking-wide"
                id="theme-select-dropdown"
                title="Select study workspace theme"
              >
                <option value="slate">🎨 Classic Slate</option>
                <option value="cosmic">🌌 Cosmic Dark</option>
                <option value="aurora">❄️ Nordic Aurora</option>
                <option value="sunset">🌇 Sunset Clay</option>
                <option value="cyber">👾 Cyber Neon</option>
              </select>
            </div>

            {/* Onboarding Interactive Tour Guide Header Button */}
            <button
              onClick={() => {
                setShowOnboarding(true);
                // Reset completed flag so guide re-runs
                localStorage.removeItem("study_commander_onboarding_completed");
                triggerCelebration(
                  "Onboarding Guide Active 🎯",
                  "Let's review the step-by-step interactive workspace manual!"
                );
              }}
              className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-full text-[11px] cursor-pointer transition shadow-sm shrink-0"
              id="header-manual-tour-btn"
              title="View App Manual Guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span className="hidden md:inline">App Guide</span>
            </button>

            {authLoading ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full animate-pulse" id="user-profile-badge-loading">
                <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-3">
                {/* Visual miniature trophy badges */}
                <div className="hidden sm:block">
                  <AchievementsShowcase
                    streak={streakDays}
                    focusMinutes={focusMinutes}
                    chapters={chapters}
                    tasks={tasks}
                    hasDiagnostic={!!weaknessDiagnostic}
                    onTriggerTestCelebrate={() => triggerCelebration("Achievement Explored! 🏆", "Keep reviewing chapters to unlock more premium badging features.")}
                    variant="compact-header"
                  />
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 pl-1.5 pr-3 py-1.5 rounded-full" id="user-profile-badge">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || "User"} 
                      className="w-6 h-6 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {(currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700 leading-tight">
                      {currentUser.displayName || "Study Commander"}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 hidden sm:inline leading-none">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      triggerCelebration("Signed Out Successfully", "You have been signed out of your Google account.");
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  id="btn-google-signout"
                  title="Sign Out of Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : customProfileSession ? (
              <div className="flex items-center gap-3">
                {/* Visual miniature trophy badges */}
                <div className="hidden sm:block">
                  <AchievementsShowcase
                    streak={streakDays}
                    focusMinutes={focusMinutes}
                    chapters={chapters}
                    tasks={tasks}
                    hasDiagnostic={!!weaknessDiagnostic}
                    onTriggerTestCelebrate={() => triggerCelebration("Achievement Explored! 🏆", "Keep reviewing chapters to unlock more premium badging features.")}
                    variant="compact-header"
                  />
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 pl-1.5 pr-3 py-1.5 rounded-full" id="user-profile-badge-custom">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-[10px]">
                    {customProfileSession.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-slate-700 leading-tight">
                      {customProfileSession.displayName}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider leading-none">
                      {customProfileSession.isGuest ? "Guest Scholar" : "Verified Member"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCustomLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  id="btn-custom-signout"
                  title="Clear Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignInWithGoogle}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold pl-3 pr-4 py-2 rounded-full cursor-pointer shadow-xs transition duration-150"
                id="btn-google-signin"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFFFFF" opacity="0.9" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FFFFFF" opacity="0.8" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#FFFFFF" opacity="0.95" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20 lg:pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar Pane Column (For desktop focus viewports) */}
        <div className="hidden lg:flex lg:col-span-3 space-y-5 flex-col" id="app-sidebar-nav-container">
          {/* Main Navigation links card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center space-x-1 px-2">
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping"></div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Workspace Hub</span>
            </div>
            
            <nav className="space-y-1.5" id="nav-tabs-rail">
              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('dashboard')}
                id="btn-nav-dashboard"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('syllabus')}
                id="btn-nav-syllabus"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'syllabus'
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'syllabus' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Subject Manager</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('planner')}
                id="btn-nav-planner"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'planner'
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'planner' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <Calendar className="w-4 h-4 shrink-0" />
                <span>AI Routine & Planner</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('academy')}
                id="btn-nav-academy"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'academy'
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'academy' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Smart Flashcards & Quizzer</span>
              </motion.button>

              <div className="pt-2 px-2 pb-1 border-t border-slate-100 mt-2">
                <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 tracking-wider">AI Innovation Lab</span>
              </div>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('twin')}
                id="btn-nav-twin"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'twin'
                    ? "bg-indigo-50 text-indigo-750 font-black border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'twin' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <Bot className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>AI Study Twin</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('memory')}
                id="btn-nav-memory"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'memory'
                    ? "bg-indigo-50 text-indigo-750 font-black border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'memory' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <Brain className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Memory Decay Curve</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('notes')}
                id="btn-nav-notes"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'notes'
                    ? "bg-indigo-50 text-indigo-700 font-black border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'notes' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <FileText className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Auto Note Sheets</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('simulator')}
                id="btn-nav-simulator"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'simulator'
                    ? "bg-indigo-50 text-indigo-700 font-black border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'simulator' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <Award className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Exam Simulator</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('mentor')}
                id="btn-nav-mentor"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'mentor'
                    ? "bg-indigo-50 text-indigo-700 font-black border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'mentor' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <Volume2 className="w-4 h-4 shrink-0 text-sky-500" />
                <span>AI Voice Mentor</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('career')}
                id="btn-nav-career"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition duration-150 cursor-pointer ${
                  activeTab === 'career'
                    ? "bg-indigo-50 text-indigo-700 font-black border border-indigo-100"
                    : "text-slate-400 hover:text-slate-600 border border-transparent"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'career' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                <Compass className="w-4 h-4 shrink-0 text-purple-500" />
                <span>Career Navigator</span>
              </motion.button>
            </nav>
          </div>

          {/* New Exam Countdown Bento Tile strictly matching Design HTML */}
          <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md">
            <p className="text-[10px] opacity-60 mb-1 font-bold uppercase tracking-widest">EXAM COUNTDOWN</p>
            <p className="text-xl font-black">
              {(() => {
                const today = new Date("2026-06-08");
                const target = new Date(examDate);
                const diff = target.getTime() - today.getTime();
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                return days > 0 ? `${days} Days Left` : days === 0 ? "Today is Exam Day!" : "Exams Ended";
              })()}
            </p>
            <div className="mt-1 text-[11px] opacity-50 font-mono">
              Target: {new Date(examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="mt-3.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-orange-500 h-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, Math.max(5, (() => {
                    const diff = new Date(examDate).getTime() - new Date("2026-06-08").getTime();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return (days / 30) * 100;
                  })()))}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Locked Pomodoro Focus Terminal beneath navigation */}
          <div>
            <Pomodoro 
              onFocusComplete={handleFocusComplete} 
              streak={streakDays} 
              onTriggerTestCelebrate={() => triggerCelebration("Daily Focus Milestone! 🏆", `You completed your focus session metrics successfully. Keep going, ${displayName}!`)}
            />
          </div>
        </div>

        {/* Tab Panel Active Workspace Area */}
        <div className="col-span-1 lg:col-span-9" id="active-tab-content-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.21, 1.02, 0.44, 1.01] }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  userName={displayName}
                  subjects={subjects}
                  chapters={chapters}
                  tasks={tasks}
                  toggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  focusMinutes={focusMinutes}
                  weaknessDiagnostic={weaknessDiagnostic}
                  runningDiagnostic={runningDiagnostic}
                  onRunDiagnostic={handleRunDiagnostic}
                  weeklyStudyHours={INITIAL_WEEKLY_HOURS}
                  streak={streakDays}
                  onTriggerTestCelebrate={() => triggerCelebration("Daily Streak Upgraded! 🔥", "Triumphant goal met successfully! Your academic study momentum is absolutely peak today.")}
                />
              )}

              {activeTab === 'syllabus' && (
                <SubjectManager
                  subjects={subjects}
                  chapters={chapters}
                  onAddSubject={handleAddSubject}
                  onDeleteSubject={handleDeleteSubject}
                  onAddChapter={handleAddChapter}
                  onDeleteChapter={handleDeleteChapter}
                  onUpdateChapterStatus={handleUpdateChapterStatus}
                  onAddToSpacedRepetition={handleAddToSpacedRepetition}
                  spacedRepetitionIds={spacedRepetitions.map(r => r.chapterId)}
                  onImportAISyllabus={handleImportAISyllabus}
                  examDate={examDate}
                />
              )}

              {activeTab === 'planner' && (
                <StudyPlanner
                  subjects={subjects}
                  chapters={chapters}
                  spacedRepetitions={spacedRepetitions}
                  onToggleReviewCompleted={handleToggleReviewCompleted}
                  onClearRepetitions={handleClearRepetitions}
                  examDate={examDate}
                  onChangeExamDate={setExamDate}
                />
              )}

              {activeTab === 'academy' && (
                <AIStudyAcademy
                  subjects={subjects}
                  chapters={chapters}
                  onAddQuizResult={handleAddQuizResult}
                  quizResults={quizResults}
                />
              )}

              {activeTab === 'twin' && (
                <AITwin
                  subjects={subjects}
                  chapters={chapters}
                />
              )}

              {activeTab === 'memory' && (
                <MemoryEngine
                  subjects={subjects}
                  chapters={chapters}
                />
              )}

              {activeTab === 'notes' && (
                <AutoNotes
                  subjects={subjects}
                  chapters={chapters}
                />
              )}

              {activeTab === 'simulator' && (
                <ExamSimulator
                  subjects={subjects}
                />
              )}

              {activeTab === 'mentor' && (
                <VoiceMentor
                  subjects={subjects}
                  chapters={chapters}
                />
              )}

              {activeTab === 'career' && (
                <CareerNavigator
                  subjects={subjects}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Compact Status footer block */}
      <footer className="bg-white border-t border-slate-100 py-3.5 px-6 mt-12" id="app-footer-credits">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Code className="w-3.5 h-3.5 text-slate-300" />
            Designed Offline-ready with durable persistent states.
          </span>
          <span className="mt-1 sm:mt-0 font-bold text-slate-500">Google AI Studio Powered</span>
        </div>
      </footer>

      {/* Triumphant custom celebration modal with particle canvas */}
      <CelebrationOverlay
        isVisible={showCelebration}
        onClose={() => setShowCelebration(false)}
        title={celebrationTitle}
        message={celebrationMessage}
        streak={streakDays}
      />

      {/* Auth Help Dialog Modal */}
      {authError && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs pointer-events-auto" id="auth-error-help-modal">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-800" id="auth-error-card">
            <button 
              onClick={() => setAuthError(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              aria-label="Close error message"
              id="btn-close-auth-error"
            >
              ✕
            </button>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl shrink-0" id="auth-error-icon-box">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">Google Sign-In Issue</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {authError}  
                </p>
                
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl mt-4 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    <span>How to fix this:</span>
                  </h4>
                  <ul className="list-disc pl-4 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
                    <li>
                      <strong>Use New Tab button</strong>: If you are running inside Google AI Studio, look at the top-right corner of the browser preview pane and click the <strong>"Open in new tab"</strong> button. Sign-in popup issues are completely bypassed in standalone windows!
                    </li>
                    <li>
                      Check your browser address bar for a <strong>Popup Blocker icon</strong> (usually with a red indicator) and choose <strong>"Always allow popups"</strong> for this development URL.
                    </li>
                    <li>
                      Ensure you didn't accidentally click close on the Google Sign-in window during the account selection step.
                    </li>
                  </ul>
                </div>
                
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setAuthError(null)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer select-none shadow-md shadow-indigo-600/10 active:scale-98"
                    id="btn-ack-auth-error"
                  >
                    Alright, Let Me Try!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tutorial Guide System for First-Timers */}
      {showOnboarding && (
        <OnboardingGuide
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onDismiss={() => {
            setShowOnboarding(false);
            localStorage.setItem("study_commander_onboarding_completed", "true");
            triggerCelebration(
              "System Calibration Synced! 🌟",
              `Tutorial clear, ${displayName}! You're fully calibrated and equipped to maintain study streak milestones.`
            );
          }}
        />
      )}

      {/* Floating System Theme Preference Suggestion Toast */}
      {showSuggestion && (
        <div 
          className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-5 duration-300 text-slate-800"
          id="theme-suggestion-toast"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shrink-0" id="theme-suggest-icon-box">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0" id="theme-suggest-text-box">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Interface Adaptive Recommendation
              </h4>
              <p className="text-sm font-extrabold text-slate-900 mt-1.5 leading-tight">
                Switch to {suggestedThemeLabel}?
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                We detected that your system settings prefer a {suggestedThemeLabel.split(" ")[0].toLowerCase()} interface.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={applySuggestion}
                  className="bg-indigo-600 hover:bg-indigo-505 bg-indigo-600 hover:bg-indigo-550 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer select-none shadow-md shadow-indigo-600/10 active:scale-98"
                  id="btn-apply-theme-suggestion"
                >
                  Yes, Try {suggestedThemeLabel.split(" ")[0]}
                </button>
                <button
                  onClick={dismissSuggestion}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                  id="btn-dismiss-theme-suggestion"
                >
                  Ignore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Overlay Component */}
      <AnimatePresence>
        {isPaletteOpen && (
          <CommandPalette
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            subjects={subjects}
            chapters={chapters}
            onAddTask={(title, subjectId) => {
              const matchedSub = subjects.find(s => s.id === subjectId);
              const suffix = matchedSub ? `[${matchedSub.name}] ` : "";
              handleAddTask(suffix + title, 2);
              triggerCelebration(
                "Short-cut Task Dispatched! ⚡",
                `The mission objective: "${title}" is now mapped into your daily study routing schedules.`
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sticky Tab Bar (Highly ergonomic navigation for phones/tablets) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2.5 flex items-center justify-around shadow-lg" id="app-mobile-nav-bar">
        <button
          onClick={() => { setActiveTab('dashboard'); setIsMobileNavOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          id="btn-mobile-nav-dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Dashboard</span>
        </button>

        <button
          onClick={() => { setActiveTab('syllabus'); setIsMobileNavOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition ${activeTab === 'syllabus' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          id="btn-mobile-nav-syllabus"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Syllabus</span>
        </button>

        <button
          onClick={() => { setActiveTab('planner'); setIsMobileNavOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition ${activeTab === 'planner' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          id="btn-mobile-nav-planner"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Planner</span>
        </button>

        <button
          onClick={() => { setActiveTab('academy'); setIsMobileNavOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition ${activeTab === 'academy' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          id="btn-mobile-nav-academy"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">Quizzer</span>
        </button>

        <button
          onClick={() => setIsMobileNavOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition ${isMobileNavOpen ? 'text-indigo-650 text-indigo-600' : 'text-slate-400 hover:text-slate-650'}`}
          id="btn-mobile-nav-more"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-tight">More Hub</span>
        </button>
      </div>

      {/* Interactive Mobile Slide-out Drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex" id="mobile-drawer-overlay">
            {/* Backdrop opacity */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              id="mobile-drawer-backdrop"
            ></motion.div>

            {/* Sliding container drawer body */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 p-5 space-y-6 text-slate-800"
              id="mobile-drawer-body"
            >
              {/* Drawer App Title bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0" id="mobile-drawer-header">
                <div className="flex items-center gap-2 animate-fade-in">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-600 block">Workspace Menu</span>
                    <h2 className="text-sm font-black text-slate-800">Commander.ai</h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  id="btn-close-mobile-drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic scrollable navigation contents */}
              <div className="flex-1 space-y-6 overflow-y-auto pr-1 select-none scrollbar-thin" id="mobile-drawer-scroll-section">
                {/* Visual miniature trophy badges */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 flex flex-col gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Accomplishments</span>
                  <AchievementsShowcase
                    streak={streakDays}
                    focusMinutes={focusMinutes}
                    chapters={chapters}
                    tasks={tasks}
                    hasDiagnostic={!!weaknessDiagnostic}
                    onTriggerTestCelebrate={() => triggerCelebration("Achievement Explored! 🏆", "Keep reviewing chapters to unlock badges.")}
                    variant="compact-header"
                  />
                </div>

                {/* Main Navigation Links */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block px-2">Workspaces</span>
                  <nav className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('dashboard'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <span>Dashboard Workspace</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('syllabus'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'syllabus' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Syllabus track</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('planner'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'planner' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Study routinely Planner</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('academy'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'academy' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span>Smart Flashcards & Quizzer</span>
                    </button>
                  </nav>
                </div>

                {/* AI Innovation Lab Navigation Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block px-2">AI Innovation Lab</span>
                  <nav className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('twin'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'twin' ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Bot className="w-4 h-4 shrink-0 text-indigo-500" />
                      <span>AI Study Twin</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('memory'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'memory' ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Brain className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>Memory Decay Curve</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('notes'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'notes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>Auto Note Sheets</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('simulator'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'simulator' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Award className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>Exam Simulator</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('mentor'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'mentor' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Volume2 className="w-4 h-4 shrink-0 text-sky-500" />
                      <span>AI Voice Mentor</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('career'); setIsMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition :text-left cursor-pointer ${
                        activeTab === 'career' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Compass className="w-4 h-4 shrink-0 text-purple-500" />
                      <span>Career Navigator</span>
                    </button>
                  </nav>
                </div>

                {/* Exam Countdown Bento Tile */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col gap-1.5 shrink-0">
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">Exam Countdown</span>
                  <p className="text-lg font-black">
                    {(() => {
                      const today = new Date("2026-06-08");
                      const target = new Date(examDate);
                      const diff = target.getTime() - today.getTime();
                      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      return days > 0 ? `${days} Days Left` : days === 0 ? "Today is Exam Day!" : "Exams Ended";
                    })()}
                  </p>
                  <p className="text-[10px] opacity-50 font-mono">
                    Target: {new Date(examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Pomodoro Timer segment inside Mobile drawer */}
                <div className="pt-2 shrink-0">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-2 px-2">Pomodoro study session</span>
                  <Pomodoro 
                    onFocusComplete={handleFocusComplete} 
                    streak={streakDays} 
                    onTriggerTestCelebrate={() => triggerCelebration("Daily Focus Milestone! 🏆", `You completed your focus session metrics successfully.`)}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
