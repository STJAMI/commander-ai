import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to lazy-initialize the GoogleGenAI SDK client securely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your Secrets in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. AI Routine Generator Endpoint
app.post("/api/ai/routine", async (req, res) => {
  try {
    const { examDate, availableHours, subjects, chaptersRemaining } = req.body;
    const ai = getGeminiClient();

    const prompt = `
      You are an elite academic counselor generating a personalized day-by-day study routine for a student.
      Inputs:
      - Exam Date: ${examDate}
      - Daily Available Hours: ${availableHours} hours
      - Subjects: ${JSON.stringify(subjects)}
      - Remaining Chapters/Topics: ${JSON.stringify(chaptersRemaining)}

      Generate a highly detailed day-by-day study routine starting from today (June 8, 2026) up to the exam date (or max 7 days of items if the gap is larger).
      Each day should contain specific time slots with subject and chapter recommendations, optimized for the user's available daily hours. Make sure times are realistic and formatted nicely, e.g., "07:00 AM - 09:00 AM". Include a slot designated for "Revision".

      You MUST respond STRICTLY in JSON format matching this schema:
      {
        "days": [
          {
            "date": "YYYY-MM-DD",
            "slots": [
              {
                "time": "7:00 AM - 9:00 AM",
                "subject": "Subject Name",
                "topic": "Chapter X: Chapter Title"
              }
            ]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  slots: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        subject: { type: Type.STRING },
                        topic: { type: Type.STRING }
                      },
                      required: ["time", "subject", "topic"]
                    }
                  }
                },
                required: ["date", "slots"]
              }
            }
          },
          required: ["days"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Routine Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate study routine" });
  }
});

// 2. AI Question/Quiz Generator Endpoint
app.post("/api/ai/quiz", async (req, res) => {
  try {
    const { subject, chapter, type } = req.body;
    const ai = getGeminiClient();

    const typeDescription = {
      MCQ: "Multiple Choice Questions with exactly 4 options. Include the correct option index (0, 1, 2, or 3) and a brief helpful explanation of why it is correct.",
      Short: "Short factual answers. Ask dynamic conceptual questions that require critical thinking. Provide a model answer and grading criteria in the explanation.",
      Creative: "Scenario-based or multi-part questions typical of higher academic levels. Provide step-by-step breakdown as correct response and full scoring guide in the explanation.",
      University: "Advanced engineering/university level deep problems with formulas or proofs. Provide detailed solution and proof guidelines in the explanation."
    }[type as 'MCQ' | 'Short' | 'Creative' | 'University'] || "Conceptual questions.";

    const prompt = `
      Create a highly engaging 3-question quiz for the chapter "${chapter}" of the subject "${subject}".
      Quiz Level/Type: ${type} (${typeDescription})

      Generate standard academic questions mapped to this syllabus. Make it educational, challenging, and clear.
      For MCQ: options must contain 4 choices. "correctAnswer" should be the string representation of the index (0-3).
      For other types (Short, Creative, University): options can be empty, and "correctAnswer" should be the sample correct model response. The "explanation" must outline the rubric, concepts used, or solution steps.

      You MUST respond STRICTLY in JSON format matching this schema:
      {
        "questions": [
          {
            "id": "q1",
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "0",
            "explanation": "Explanation and solution steps."
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Quiz Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate dynamic quiz" });
  }
});

// 3. AI Topic Explainer Endpoint
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { topic, style } = req.body;
    const ai = getGeminiClient();

    const styleInstructions = {
      Easy: "Explain like I am five years old. Use highly relatable analogies, visual text-based metaphors, and simple language.",
      "Exam Style": "Structure with clear sections like Definition, Key Principles, Common Exam Questions, and High-Scoring Tips. Use standard academic headers.",
      Detailed: "Provide a rigorous university-level outline. Explain initial conditions, mathematical foundations, code block examples if applicable (rendered beautifully in Markdown), and exact edge cases."
    }[style as 'Easy' | 'Exam Style' | 'Detailed'] || "Provide an academic overview.";

    const prompt = `
      You are an inspiring, warm, and brilliant AI Tutor. Explain the topic: "${topic}".
      Target Tone/Style: ${styleInstructions}

      Format your output with professional Markdown (e.g., using headings, bullet points, and codeblocks where appropriate).
      Add an interactive "Summary & Quick Quiz Question" at the very end to help retention.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ explanation: response.text || "No explanation got returned from AI." });
  } catch (error: any) {
    console.error("AI Explain Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI tutoring explanation" });
  }
});

// 4. AI Weakness Detector & Recommendations Endpoint
app.post("/api/ai/weakness", async (req, res) => {
  try {
    const { subjectList, chapterSyllabus, quizScores } = req.body;
    const ai = getGeminiClient();

    const prompt = `
      You are the AI Study Commander Analytics Core. Analyze this student's performance data and generate target study insights.
      Current profile:
      - Enrolled Subjects: ${JSON.stringify(subjectList)}
      - Syllabus Progress (Chapters): ${JSON.stringify(chapterSyllabus)}
      - Recent Quiz Performance metrics: ${JSON.stringify(quizScores)}

      Provide a specialized diagnostic check. Point out exactly which subject or chapter is lagging, identify a critical topic of weakness, and recommend a concrete actionable revision action.
      
      Respond with a JSON object in this format:
      {
        "overallInsight": "A high level summary of their current focus strength & study balance.",
        "weaknesses": [
          {
            "subject": "Physics 1st Paper",
            "accuracy": "58%",
            "recommendedTopic": "Wave Motion & Wave Propagation",
            "planOfAction": "Complete 2 timed quizzes and read the Exam-Style explanation of waves."
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallInsight: { type: Type.STRING },
            weaknesses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  accuracy: { type: Type.STRING },
                  recommendedTopic: { type: Type.STRING },
                  planOfAction: { type: Type.STRING }
                },
                required: ["subject", "accuracy", "recommendedTopic", "planOfAction"]
              }
            }
          },
          required: ["overallInsight", "weaknesses"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Weakness Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to perform weakness analysis" });
  }
});

// 5. AI Conversational Syllabus Installer Endpoint
app.post("/api/ai/parse-syllabus", async (req, res) => {
  try {
    const { userInput } = req.body;
    const ai = getGeminiClient();

    const prompt = `
      You are an elite academic curriculum manager.
      The user describes their target exams and current classes in a conversational voice:
      User Input: "${userInput}"

      Your task is to parse this information into a structured subject course catalog with appropriate syllabus chapters and estimate exam boundaries.
      Guidelines:
      1. Identify the target subjects (e.g. "Physics", "Chemistry", "Art") and assign each a gorgeous, modern hex color badge (e.g., violet, indigo, rose, teal, amber colors).
      2. For each subject, structure realistic exam chapters or core topics to complete. If the user hasn't specified exact chapters, suggest 3-5 realistic standard syllabus chapters/topics of that subject.
      3. For each chapter, assign a realistic difficulty level ("Easy", "Medium", or "Hard") and estimated study hours (e.g., 2 to 8 hours).
      4. Detect the exam date. If mentioned (e.g., "June 30th", "next week", "in 14 days"), calculate the actual date of the exam relative to today (today is June 8, 2026). If not mentioned, default to any future date like "2026-06-25".
      5. Formulate a short, helpful professional suggestion/comment or polite query in "clarificationPrompt" such as "Do you have any elective papers to add to this?" (adhering to the user's prompt "ask me if anything needed").

      You MUST respond STRICTLY in JSON format matching this schema:
      {
        "examDate": "YYYY-MM-DD",
        "subjects": [
          {
            "name": "Subject Name",
            "color": "#HEXCODE",
            "chapters": [
              {
                "title": "Chapter Title",
                "difficulty": "Easy",
                "estimatedHours": 4
              }
            ]
          }
        ],
        "clarificationPrompt": "Short check dialog question..."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examDate: { type: Type.STRING },
            subjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  color: { type: Type.STRING },
                  chapters: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        estimatedHours: { type: Type.NUMBER }
                      },
                      required: ["title", "difficulty", "estimatedHours"]
                    }
                  }
                },
                required: ["name", "color", "chapters"]
              }
            },
            clarificationPrompt: { type: Type.STRING }
          },
          required: ["examDate", "subjects", "clarificationPrompt"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Parse Syllabus Error:", error);
    res.status(500).json({ error: error.message || "Failed to process conversational syllabus instruction" });
  }
});

// 6. AI Study Conversational Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: "You are the AI Study Commander, an elite academic advisor. Provide thorough, friendly, and step-by-step academic guidance. Solve math or physics formulas using analogies, explain computer science ideas, and format key blocks cleanly in Markdown. Keep your tone encouraging and brilliant!"
      }
    });

    res.json({ responseText: response.text || "No response received from tutor." });
  } catch (error: any) {
    console.error("AI Chat Assistant Error:", error);
    res.status(500).json({ error: error.message || "Failed to receive AI tutor chat answer" });
  }
});

// 7. AI Flashcards Generator Endpoint
app.post("/api/ai/flashcards", async (req, res) => {
  try {
    const { subject, chapter } = req.body;
    const ai = getGeminiClient();

    const prompt = `
      You are the AI Study Commander Flashcard wizard. Create 4 highly effective, structured study flashcards to study the chapter or topic "${chapter}" within the subject "${subject}".
      Provide targeted active recall questions and micro-diagram/formula representations.
      The front should challenge Jami to think of the answer. The back should provide the accurate concise answer or explanatory helper.

      You MUST respond STRICTLY in JSON format matching this schema:
      {
        "flashcards": [
          {
            "id": "fc_x",
            "front": "Active recall prompt/concept front question",
            "back": "Master answer/proof outline back summary"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                },
                required: ["id", "front", "back"]
              }
            }
          },
          required: ["flashcards"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Flashcards Endpoint Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate active recall study flashcards" });
  }
});

// 8. AI Voice Note Transcriber Endpoint
app.post("/api/ai/transcribe-voice-note", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "No audio data provided." });
    }
    const ai = getGeminiClient();

    const audioPart = {
      inlineData: {
        mimeType: mimeType || "audio/webm",
        data: audio,
      },
    };

    const promptText = {
      text: `You are an intelligent study assistant. Listen to this quick voice note recorded by the student.
      Extract a clear, concise master task or todo title (e.g. "Revised Physics wave motion formula" or "Write literature review essay draft")
      and determine the priority of this task (1 = High, 2 = Medium, 3 = Low) based on the tone, urgency, or context of their statement. If the priority is ambiguous, default to 2.

      You MUST respond STRICTLY in JSON format matching this schema:
      {
        "title": "Task title parsed from audio",
        "priority": 1
      }`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [audioPart, promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: {
              type: Type.INTEGER,
              description: "1 = High, 2 = Medium, 3 = Low"
            }
          },
          required: ["title", "priority"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Voice Note Transcription Error:", error);
    res.status(500).json({ error: error.message || "Failed to process voice note" });
  }
});

// 9. AI Study Twin Endpoint
app.post("/api/ai/twin-chat", async (req, res) => {
  try {
    const { message, history, twinType, completedChapters } = req.body;
    const ai = getGeminiClient();

    const twinPrompts = {
      studious: "You are Jami's Study Twin, an ultra-studious, ambitious, organized peer who is obsessed with optimal performance, syllabus coverage, and academic excellence. You speak with high energy, encourage rigorous schedules, and mention cool revision techniques like Active Recall.",
      rebel: "You are Jami's Study Twin, a high-intelligence rebel peer. You find rote learning a bit tedious but love mastering hard concepts through first principles. You speak with wittiness, friendly sarcasm, and advocate for clever hacks, shortcuts, and focus blocks rather than dragging study hours.",
      auditor: "You are Jami's Study Twin, a highly critical, meticulous examiner and auditor. You ask demanding follow-up questions, check for edge cases, remind Jami of common examiner traps, and want to verify deep understanding rather than superficial reading."
    };

    const instruction = `${twinPrompts[twinType as "studious"|"rebel"|"auditor"] || twinPrompts.studious}
    Refer to Jami by name occasionally. Keep the dialogue relatively concise, supportive, and academically focused.
    You have memory of currently completed subjects/chapters: ${JSON.stringify(completedChapters)}.
    Respond in standard conversational English, with optional markdown formatting. Do not use unprovable facts.`;

    const contents = [];

    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === "user" ? "user" as const : "model" as const,
          parts: [{ text: turn.text }]
        });
      }
    }
    contents.push({
      role: "user" as const,
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: instruction,
        temperature: 0.8
      }
    });

    res.json({ text: response.text || "No response generated." });
  } catch (error: any) {
    console.error("Twin Chat Error:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with AI Study Twin" });
  }
});

// 10. Memory Engine Prompt Endpoint
app.post("/api/ai/memory-prompt", async (req, res) => {
  try {
    const { subject, chapter } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate 1 highly effective active recall prompt for a student studying "${chapter}" in "${subject}".
    This should be a conceptual, high-yield revision prompt that quickly tests if they understand the key underlying mechanism or formula of this chapter.
    Include a short hint, and the complete answer explanation so the student can grade their retention index.

    Respond STRICTLY in JSON format:
    {
      "prompt": "The active recall question...",
      "hint": "Cryptic short hint...",
      "answer": "Detailed answer key for self-examination..."
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            hint: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["prompt", "hint", "answer"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Memory Prompt Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate active recall prompt" });
  }
});

// 11. Auto Note Generator Endpoint
app.post("/api/ai/generate-notes", async (req, res) => {
  try {
    const { subject, chapter } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are an elite academic tutor creating a definitive summary note sheet for "${chapter}" of "${subject}".
    Create a highly structured, dense, beautiful markdown cheatsheet using standard headers, bullet points, and clean syntax.
    Include:
    1. 📌 Core Concepts & Definitive Explanations
    2. 📐 Essential Mathematical Formulas or Framework Theorems
    3. ⚠️ Common Examiner Traps, Crucial Pitfalls & High-Yield Mistakes
    4. 💡 Active Recall self-test recommendation.
    Ensure formatting is beautiful, clean, and extremely readable. Limit the notes length so they are condensed and study-focused.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3
      }
    });

    res.json({ markdown: response.text || "No notes generated." });
  } catch (error: any) {
    console.error("Auto Notes Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate dynamic notes" });
  }
});

// 12. Exam Simulator Mock Quiz Generator
app.post("/api/ai/exam-simulator", async (req, res) => {
  try {
    const { subject, format, numQuestions } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are the lead academic chief examiner creating a real-time mock exam simulation.
    Create a full custom standardized mock paper for the study subject "${subject}".
    Simulation Format: ${format} (SAT, AP Exam, HSC Board, GCSE Standard, or General)
    Number of Questions requested: ${numQuestions || 5}

    Formulate highly realistic academic questions of varying difficulties (Easy, Medium, Hard).
    Each question must be Multiple Choice with exactly 4 options. Include the correct option index (0, 1, 2, or 3) and a comprehensive explanation outlining the solution walkthrough/rubric.

    You MUST respond STRICTLY in JSON format matching this schema:
    {
      "questions": [
        {
          "id": "sim_q_1",
          "question": "Standardized academic question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "0",
          "explanation": "Walkthrough explanation showing the solution calculation or concept."
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Exam Simulator Error:", error);
    res.status(500).json({ error: error.message || "Failed to build exam simulation package" });
  }
});

// 13. Career Alignment Advisor Endpoint
app.post("/api/ai/career-advice", async (req, res) => {
  try {
    const { subjects } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are a high-level strategic career advisor and tech recruiter.
    Analyze the current subjects Jami is studying: ${JSON.stringify(subjects)}.
    Map these foundational academic subjects to 3 high-impact futuristic or standard professional roles (e.g., Telecom Infrastructure Specialist for ICT, Quantitative Analyst for Math, Avionics Engineer for Physics, etc.).
    For EACH career path, generate:
    1. Title of the role
    2. Connection: How their current studies directly supply the prerequisite fundamentals for this career.
    3. Essential Industry Skills: What active softwares, stack languages, and technical specs they must learn next.
    4. Suggested Micro-Project: A specific, practical hands-on portfolio project they can build to get recruited.

    You MUST respond STRICTLY in JSON format matching this schema:
    {
      "roles": [
        {
          "title": "Role Title",
          "connection": "Detailed academic-to-career connection explanation.",
          "skills": ["Skill 1", "Skill 2", "Skill 3"],
          "suggestedProject": {
            "name": "Project Name",
            "spec": "Clear spec description of what the project does and how to start."
          }
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  connection: { type: Type.STRING },
                  skills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  suggestedProject: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      spec: { type: Type.STRING }
                    },
                    required: ["name", "spec"]
                  }
                },
                required: ["title", "connection", "skills", "suggestedProject"]
              }
            }
          },
          required: ["roles"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Career Advisor Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate prospective industry options" });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
