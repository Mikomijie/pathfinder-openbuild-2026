# Pathfinder 🧭

**Adaptive learning platform for neurodivergent Nigerian students**

Built for OPEN//BUILD 2026 by Omijie Michael and Teniola Awodire

---

## What is Pathfinder?

Pathfinder is an AI-powered adaptive learning platform designed specifically for neurodivergent students in Nigeria (ADHD, dyslexia, dyscalculia, and more). It meets each student where they are — breaking down complex topics into 4 progressive lesson levels, generating quizzes and flashcards on demand, and flagging when a student is stuck so teachers can step in.

---

## The Problem

Nigerian classrooms are large, fast-paced, and rarely designed with neurodivergent learners in mind. Students who learn differently — those with ADHD, dyslexia, or processing differences — are often left behind, not because they can't learn, but because the content isn't presented in a way that works for them.

Pathfinder changes that.

---

## Features

### For Students
- **4-Level Adaptive Lessons** — Every topic is taught in 4 ways: Simple Explanation → Real-Life Analogy → Visual/Step-by-Step → Reflective Question
- **AI Quiz Generation** — 5-question multiple choice quizzes auto-generated from lesson content
- **Flashcard Mode** — 6 flashcards per topic with flip animation and knew-it/still-learning tracking
- **Voice Read-Aloud** — Web Speech API reads lesson content aloud at 0.5×, 0.75×, or 1.0× speed
- **Focus Mode** — Dark overlay that hides distractions while studying
- **PDF Upload / Paste Notes** — University students can upload their own notes and get instant micro-lessons
- **Progress Tracking** — Visual progress bars, scores, and streak nudges
- **Skills Hub** — Study tips for time management, exam prep, memory, focus, and wellbeing

### For Teachers
- **Class Management** — Create classes with auto-generated PATH-XXXX join codes
- **PDF Upload** — Upload study material; AI splits it into micro-lessons for the whole class
- **Student Monitoring** — See each student's progress, average score, and stuck status in real time
- **Realtime Updates** — Live Supabase subscriptions show when students join

---

## AI Model

Pathfinder uses **Meta Llama 3.3 70B Instruct** (`meta-llama/llama-3.3-70b-instruct:free`) via [OpenRouter](https://openrouter.ai).

This open-weight model powers:
- Lesson generation (4 adaptive levels per topic)
- Quiz question generation (5 MCQs per topic)
- Flashcard generation (6 cards per topic)
- PDF-to-lesson conversion (server-side via Supabase Edge Function)

All AI calls include Nigerian cultural context — analogies and examples are grounded in everyday Nigerian life.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Create React App) + Tailwind CSS |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) |
| AI | OpenRouter — Meta Llama 3.3 70B Instruct (open-weight) |
| PDF Processing | `unpdf@0.11.0` (runs in Edge Function) |
| Voice | Web Speech API (browser-native) |
| Routing | React Router v6 |

---

## Project Structure

```
pathfinder/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── SelectRole.jsx
│   │   │   └── dashboard/
│   │   │       ├── StudentDashboard.jsx
│   │   │       ├── TeacherDashboard.jsx
│   │   │       ├── lesson/
│   │   │       │   ├── Lesson.jsx
│   │   │       │   ├── Quiz.jsx
│   │   │       │   └── LessonComplete.jsx
│   │   │       ├── flashcards/
│   │   │       │   └── Flashcards.jsx
│   │   │       └── progress/
│   │   │           └── Progress.jsx
│   │   ├── services/
│   │   │   └── openrouter.js
│   │   └── App.js
│   └── supabase/
│       └── functions/
│           └── process-pdf/
│               └── index.ts
```

## Database Schema (Supabase)

- `profiles` — user info, grade level, learning style, neurodivergent type
- `classes` — teacher's classes with join codes
- `class_members` — student↔class enrollment
- `topics` — lesson topics (per class or per student)
- `lessons` — 4-level lesson content per topic
- `student_progress` — per-student per-topic progress, scores, stuck flags

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- OpenRouter API key (free tier works)

### Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key

Set Supabase Edge Function secrets:
```bash
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
```

```bash
npm start
```

---

## Deployment

- Frontend: [Vercel](https://vercel.com)
- Edge Functions: Supabase (auto-deployed via `supabase functions deploy process-pdf`)

---

## Hackathon

Built for **OPEN//BUILD 2026** — OSCA Ile-Ife Hackathon  by team winner (Michael Omijie and TEniola Awodire) 
Submission deadline: October 29, 2026

---

## Acknowledgements

- [OpenRouter](https://openrouter.ai) for free-tier access to Meta Llama 3.3 70B
- [Meta AI](https://ai.meta.com) for the open-weight Llama 3.3 model
- [Supabase](https://supabase.com) for auth, database, and edge functions
- [OSCA Ile-Ife](https://oscaife.dev) for organizing OPEN//BUILD 2026
