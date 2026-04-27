# DriftSense — Mission Control for Founding Teams

> **GDG on Campus FAST NUCES CFD · Build with AI Hackathon 2026**

## Live Demo

**[https://drift-sense-637370368897.us-central1.run.app](https://drift-sense-637370368897.us-central1.run.app)**

---

## What Problem We Solved

Early-stage founding teams lose enormous amounts of time to communication drift. Paul tells an investor the API ships Friday. Sam tells the same customer it's being rebuilt. Nobody knows there's a contradiction until something breaks.

DriftSense is an AI-native commitment tracking system that captures promises made across Slack, Gmail, and Notion, detects when co-founders contradict each other, and gives each founder a personalized daily briefing — so misalignments are caught before they become problems.

This is not a smarter spreadsheet. Without AI, extracting commitments from freeform conversation text is not possible at scale. The entire system depends on AI understanding intent, context, and contradiction from natural language.

---

## How It Works

### System Flow

```
Slack / Gmail / Notion / Manual
          ↓
POST /api/capture
AI reads the raw message and asks:
"Is there a commitment here? Who made it, to whom, and when?"

          ↓
Commitment stored in Firebase

          ↓
GET /api/conflicts
AI cross-checks ALL pending commitments across both founders
and flags contradictions with severity levels (high / medium / low)

          ↓
GET /api/briefing/:founder
Each founder gets a personalized cached daily summary:
"Here's what you owe. Here's what others owe you. Here's what conflicts."
```

### The Four API Routes

| Route | Method | What It Does |
|---|---|---|
| `/api/capture` | POST | Ingests a raw message, sends it to AI, extracts and stores any commitment found |
| `/api/commitments` | GET | Returns all stored commitments, filterable by `?founder=paul` or `?founder=sam` |
| `/api/conflicts` | GET | Feeds all pending commitments to AI and returns detected misalignments |
| `/api/briefing/:founder` | GET | Returns a personalized AI-generated daily summary per founder, cached once per day |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 20 + Express 5 | Lightweight, fast, well-supported |
| AI Access | OpenRouter API | Unified API gateway for model access |
| Database | Firebase | Real-time, serverless, no schema setup required |
| Deployment | Google Cloud Run | Containerised, auto-scaling, serverless |
| Container | Docker (Node 20 slim) | Consistent builds, minimal image size |
| IDE | Antigravity | AI-integrated development environment |
| Frontend | HTML + CSS + JavaScript | Served statically from the same Express server — no CORS, one container, one URL |

---

## AI Tools Used

- **OpenRouter** — API gateway used to access AI models for commitment extraction, conflict detection, and briefing generation
- **Firebase** — real-time database for storing and querying commitments
- **Google Cloud Run** — containerised deployment and production hosting
- **Antigravity** — AI-integrated IDE used during development
- **Claude (Anthropic)** — used during development for brainstorming solution architecture, debugging, and refining AI prompts

---

## Project Structure

```
DriftSense/
├── src/
│   ├── index.js              # Express server entry point, health check at /health
│   ├── config/
│   │   ├── firebase.js       # Firebase initialisation
│   │   └── gemini.js         # OpenRouter client configuration
│   └── routes/
│       ├── capture.js        # POST /api/capture — commitment extraction via AI
│       ├── commitments.js    # GET  /api/commitments — read from Firebase
│       ├── conflicts.js      # GET  /api/conflicts — cross-founder conflict detection
│       └── briefing.js       # GET  /api/briefing/:founder — daily summary, cached per founder per day
├── public/                   # Frontend (HTML, CSS, JS) served statically
├── Dockerfile                # Node 20 slim, PORT=8080, production deps only
├── .env.example              # Environment variable reference
├── .dockerignore
├── .gitignore
├── package.json
└── README.md
```

---

## Running Locally

### Prerequisites

- Node.js 18 or higher
- A Google Cloud project with Firebase enabled
- An OpenRouter API key from [openrouter.ai](https://openrouter.ai/keys)
- A Firebase service account JSON file

### Setup

```bash
# Clone the repo
git clone https://github.com/Gojiro-34/DriftSense.git
cd DriftSense

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your OPENROUTER_API_KEY and GOOGLE_APPLICATION_CREDENTIALS path
```

### Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

App runs at `http://localhost:8080`

### Seed demo data

```bash
npm run seed
```

---

## Environment Variables

```env
# OpenRouter API Key — get from https://openrouter.ai/keys
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=your-chosen-model

# Firebase — path to service account JSON (local dev)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Firebase project ID (Cloud Run uses Application Default Credentials — no JSON needed)
# FIREBASE_PROJECT_ID=your-project-id

# Server port
PORT=8080
```

---

## Deploy to Google Cloud Run

```bash
gcloud run deploy driftsense \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENROUTER_API_KEY=your-key \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id
```

On Cloud Run, the attached service account handles Firebase authentication automatically via Application Default Credentials — no JSON file needed.

---

## Example API Usage

### Capture a commitment

```bash
POST /api/capture
Content-Type: application/json

{
  "source": "slack",
  "message": "I'll have the pitch deck done by Friday",
  "sender": "paul",
  "timestamp": "2026-04-27T10:00:00Z"
}
```

**Response:**
```json
{
  "extracted": true,
  "commitment": {
    "text": "Complete the pitch deck by Friday",
    "owner": "paul",
    "deadline": "2026-05-01",
    "source": "slack",
    "id": "abc123"
  }
}
```

### Get daily briefing

```bash
GET /api/briefing/paul
GET /api/briefing/sam
```

---

## Third-Party Tools & Disclosures

| Tool | Purpose |
|---|---|
| OpenRouter | API gateway for AI model access |
| Firebase | Real-time database |
| Google Cloud Run | Container hosting and deployment |
| Antigravity | AI-integrated IDE used for development |
| Express 5 | Web framework |
| dotenv | Environment variable management |
| cors | Cross-origin request handling |
| Docker | Containerisation |
| Claude (Anthropic) | Development assistance — architecture, prompt design, debugging |

---

## Team
24F-3070
24F-3000
24F-3103
Built in 24 hours as part of the **GDG on Campus FAST NUCES CFD — Build with AI Hackathon 2026**, part of the global Google Developer Groups Build with AI initiative.
