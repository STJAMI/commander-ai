export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'not_started' | 'in_progress' | 'completed';
  completionDate?: string; // ISO string
  estimatedHours: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  deadline?: string;
  priority: 1 | 2 | 3; // 1 = High, 2 = Medium, 3 = Low
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  notes?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // for MCQ
  correctAnswer: string; // index (e.g. "0", "1") or text response
  explanation: string;
}

export interface QuizResult {
  id: string;
  subjectName: string;
  chapterTitle: string;
  type: 'MCQ' | 'Short' | 'Creative' | 'University';
  score: number; // percentage
  totalQuestions: number;
  correctAnswers: number;
  weaknessDetected?: string;
  recommendation?: string;
  date: string;
}

export interface SpacedRepetitionItem {
  id: string;
  chapterId: string;
  chapterTitle: string;
  subjectName: string;
  completedDate: string;
  reviews: {
    stage: '1 Day' | '3 Days' | '7 Days' | '14 Days';
    dueDate: string;
    completed: boolean;
  }[];
}

export interface AIRoutinePlan {
  days: {
    date: string;
    slots: {
      time: string;
      subject: string;
      topic: string;
    }[];
  }[];
}
