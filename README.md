# CREDA - AI-Powered Hiring Intelligence

> **Creda** uses AI to conduct authentic, experience-based technical interviews that detect genuine expertise and eliminate resume fraud.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://creda-alpha.vercel.app/)
---

## Problem Statement

**Hiring is broken.** Recruiters spend hours interviewing candidates who:
- Copy answers from Google/ChatGPT during interviews
- Exaggerate resume skills they can't demonstrate
- Give textbook definitions instead of real experience

**Creda solves this** by conducting AI-powered interviews that:
- Ask **unpredictable, personal experience questions** that can't be Googled
- Use **STAR method detection** to identify genuine experience narratives
- Score **answer authenticity** to flag rehearsed or generic responses
- Generate **professional PDF reports** with actionable hiring recommendations

---

## Features

### For Recruiters
- **Create Screening Codes** - Generate shareable interview codes for any role
- **Dashboard Analytics** - Track candidates, scores, and verdicts
- **Professional Reports** - Download PDF reports with skill breakdowns
- **Verdict System** - Pass / Hold / Fail recommendations with reasoning

### For Candidates
- **Natural Chat Interview** - Conversational experience, not rigid forms
- **4 Focused Questions** - Quick 10-15 minute assessment
- **Anti-Cheat Protection** - Paste detection, typing analysis
- **Instant Feedback** - Download PDF report after completion

### AI Engine
- **STAR Method Evaluation** - Detects Situation, Task, Action, Result patterns
- **Metrics Detection** - Scores answers with percentages, numbers, outcomes
- **Red Flag Detection** - Identifies generic, textbook, or rehearsed responses
- **Skill Mapping** - Matches resume skills to job requirements

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite |
| **Styling** | Tailwind CSS + Custom Design System |
| **Animations** | Framer Motion |
| **Backend** | Node.js + Express |
| **Database** | SQLite (better-sqlite3) |
| **PDF Generation** | jsPDF |
| **Deployment** | Vercel (Frontend) + Render (Backend) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### 1. Clone & Install

```bash
git clone https://github.com/Zorrojurro/CREDA.git
cd CREDA
npm install
```

### 2. Start Backend Server

```bash
cd server
npm install
npm start
```
Backend runs on `http://localhost:3001`

### 3. Start Frontend

```bash
# In root directory
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## Project Structure

```
CREDA/
├── src/
│   ├── components/           # React UI components
│   │   ├── ui/               # Reusable UI primitives
│   │   ├── InterviewChat.jsx
│   │   ├── RecruiterDashboard.jsx
│   │   └── CandidateFeedbackView.jsx
│   ├── engine/               # AI Scoring Logic
│   │   ├── AuthenticityScorer.js
│   │   ├── QuestionGenerator.js
│   │   ├── SkillMapper.js
│   │   └── DecisionEngine.js
│   ├── services/             # API layer
│   └── utils/                # Helper functions
│       ├── textAnalysis.js   # STAR method & metrics detection
│       └── constants.js      # Question templates
├── server/
│   ├── index.js              # Express API
│   └── database.js           # SQLite data layer
└── package.json
```

---

## How It Works

### 1. Recruiter Creates Screening Code
- Defines role, required skills, experience level
- Gets shareable 6-character code (e.g., `ABC123`)

### 2. Candidate Takes Interview
- Enters code → Uploads resume → Starts chat
- AI asks 4 **experience-based, STAR-focused questions**
- Example: *"Tell me about a specific project where you used React. What was the situation, what did YOU do, and what was the measurable outcome?"*

### 3. AI Evaluates Responses
- **STAR Detection**: Checks for Situation, Task, Action, Result patterns
- **Metrics Scoring**: Bonus for percentages, time measurements, outcomes
- **Authenticity Analysis**: Flags generic or textbook-style answers
- **Red Flag Detection**: Identifies copy-paste or AI-generated content

### 4. Results Generated
- **Trust Score**: 0-100% overall rating
- **Verdict**: Pass / Hold / Fail with reasoning
- **PDF Report**: Professional downloadable assessment

---

## Scoring Algorithm

```
Overall Score = Weighted Average of:
├── Skill Match (30%)      - Resume skills vs job requirements
├── Authenticity (35%)     - STAR method + specificity + metrics
├── Communication (20%)    - Clarity and structure
└── Consistency (15%)      - Coherence across answers
```

### STAR Method Detection
Answers are scored higher when they include:
- **Situation**: Context (when/where/what project)
- **Task**: Responsibility (my role was...)
- **Action**: Concrete steps taken (I built/I decided/I fixed)
- **Result**: Measurable outcomes (reduced by 40%, shipped to X users)

---

## Security Features

- **Paste Detection**: Alerts when candidates paste content
- **Anti-Copy Questions**: Personal experience questions can't be Googled
- **Session Tokens**: Secure recruiter authentication
- **One-Time Codes**: Screening codes expire and can be used once per email

---

## Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | [https://creda.vercel.app](https://creda.vercel.app) |
| **Backend API** | [https://creda-backend-3mb5.onrender.com](https://creda-backend-3mb5.onrender.com) |

### Try It Out
1. Visit the demo and select **"I'm a Recruiter"**
2. Register a new account
3. Create a screening code for any role
4. Open a new tab, select **"I'm an Applicant"**
5. Enter the code and complete the interview

---

## Team

Built for smarter hiring.

