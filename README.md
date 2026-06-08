# 🌌 AI Study Commander

**AI Study Commander** is an elite, full-stack personal study cockpit and academic routine dashboard. Combining full-stack state coordination with intelligent adaptive algorithms, it equips students, researchers, and self-taught developers with professional grade tools to map syllabi, schedule routines, cement retention, and navigate prospective career paths.

Designed as an aesthetic, high-contrast workspace, the interface leverages fluid display typography, rigorous visual margins, and staggered physics-based transition animations to make studying immersive, efficient, and cohesive.

---

## 🚀 Key Architectural Modules

### 1. Interactive Command Terminal (`⌘K` Space Control)
* **Instant Action Command Palette**: Access any feature or trigger tasks instantaneously with the customizable modal search deck.
* **Smart Task Generator**: Instantly register active learning checklist items directly from the keyboard without shifting context.

### 2. Animated Progress Bento Board (The Dashboard)
* **Staggered Physics Entrances**: Integrated with specialized `motion/react` layout animation curves to slide up and fade in each stat tile sequentially on mount.
* **Persistent Active Analytics**: Live calculation of study hours, streak calendars, mock test progress, and custom academic milestones.

### 3. Structural Syllabus Planner
* **Dynamic Syllabus Compilation**: Add, remove, and partition subject chapters with difficulty weighting.
* **Schedules and Routines**: Translate active syllabus goals into realistic, custom hourly routines based on estimated exam time pressure.

### 4. Interactive Pomodoro Co-worker
* **Visual Work/Break Loops**: Precise timer with adjustable focus states.
* **Humble Soundscapes**: Play integrated ambient sounds (Focus Rain, Deep Waves, Cafe Chatter) with fine-grained slider-based volume controls.
* **Celebration Triggers**: Interactive, dynamic mock particle celebrations matching study milestones.

### 5. Memory Space (Spaced Repetition Decks)
* **Spaced Repetition Learning**: Simple visual index cards crafted to prompt active recollection.
* **Aesthetic Card Physics**: Smooth card-flipping mechanics for definitions, core equations, and formulas.

### 6. Dynamic Exam Simulator
* **Formulated Mock Testing**: Generate subject papers matching active syllabus content.
* **Tutor Walkthrough Breakdowns**: Diagnostics indicating key pain points alongside a full master tutor step-by-step review interface.

### 7. Virtual AI Twin & Voice Mentor
* **Expert Chat Interface**: Exchange notes with a virtual study expert who tracks the current calendar state.
* **Audio Consulting**: Audio-enhanced consultations on scheduling blocks, formula explanations, and revision priorities.

### 8. Career Navigator Paths
* **Prospective Career Alignment**: Direct translation of syllabus material into prospective career outcomes, detailing industry titles, portfolio projects, and active concepts.

---

## 🛠️ Technology & Structural Specs

* **Client Framework**: [React 19](https://react.dev/) + [Vite 6](https://vite.dev/)
* **Backend Engines**: [Express 4](https://expressjs.com/) (proxied in Dev through Vite, Compiled as standalone ESM CJS in production)
* **Animation System**: [Framer Motion (`motion/react`)](https://motion.dev/)
* **Styling Framework**: [Tailwind CSS v4.0](https://tailwindcss.com/)
* **AI Integration**: [Google GenAI TypeScript SDK (`@google/genai`)](https://github.com/google/generative-ai-js)
* **Data Layer**: [Firebase Firestore](https://firebase.google.com/) for deep, durable cloud persistence

---

## 📦 Script Manifest

All compilation and startup procedures are managed through standard workspace scripts:

* `npm run dev`: Starts the TypeScript server execution context with `tsx server.ts` routing the Vite middleware directly in development.
* `npm run build`: Bundles the client assets and compiles the backend TypeScript server into a streamlined, high-performance CJS production package (`dist/server.cjs`) using `esbuild`. 
* `npm run start`: Launches the compiled, self-contained production bundle.
* `npm run lint`: Hot validation of all TypeScript references to ensure type safety.

---

## 🔑 Environment Settings

To use AI-powered features (like the Exam Simulator, Career Consultant, or AI Twin), create a `.env` configuration file in the project's root:

```env
# Gemini Session Endpoint Configuration
GEMINI_API_KEY=your_secret_gemini_api_key_here
```

*Note: Server-side keys are secured through the backend and are never exposed directly to client-facing browser bundles.*

---

## 🎨 Design Philosophy and Polish
Every interface choice in AI Study Commander is deliberate:
* **Slate Light Contrast Theme**: Standardizes on rich graphite grays (`text-slate-800`), highly responsive indigo indicators (`text-indigo-600`), and clean white surfaces surrounded by light overlays (`bg-slate-50/50`).
* **Visual Rhythm**: Utilizes balanced spacing, rounded curves (`3xl`/`2xl`), and elegant font pairings (such as clean *"Inter"* sans-serif for content paired with modern tracking for metrics).
* **Zero Telemetry Clutter**: Free of mock server ports, online circles, or unrequested terminal logging panels. Focuses strictly on user outcomes and visual cleanliness.
