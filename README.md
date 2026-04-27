# CoFounder API

**AI context-sync agent for startup founding teams.**

CoFounder captures decisions, commitments, and promises across your communication channels (Slack, Gmail, Notion) and keeps your founding team in sync using AI-powered analysis.

---

## Features

- **Capture** — Ingest messages and auto-extract commitments using Gemini AI
- **Track Commitments** — View all promises, decisions, and deliverables
- **Detect Conflicts** — AI identifies misalignments between founders
- **Daily Briefings** — Personalized summaries for each founder

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** Cloud Firestore (Firebase Admin SDK)
- **AI:** Gemini 2.0 Flash (Google AI SDK)
- **Deployment:** Google Cloud Run

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A Google Cloud project with Firestore enabled
- A Gemini API key from [AI Studio](https://aistudio.google.com/apikey)
- A Firebase service account JSON file

### 2. Setup

```bash
# Install dependencies
npm install

# Copy and fill in your environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and path to service-account.json
```

### 3. Run Locally

```bash
npm run dev
```

The API will be available at `http://localhost:8080`.

---

## API Endpoints

### `POST /api/capture`

Capture a message and extract commitments.

```json
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

### `GET /api/commitments`

Fetch all commitments. Filter by founder with `?founder=paul`.

### `GET /api/conflicts`

Detect misalignments between founders' commitments.

### `GET /api/briefing/:founder`

Get a personalized daily briefing for a founder.

```
GET /api/briefing/paul
GET /api/briefing/sam
```

---

## Deploy to Cloud Run

### Option 1: gcloud CLI

```bash
# Build and deploy in one step
gcloud run deploy cofounder-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-key-here \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id
```

### Option 2: Docker + Artifact Registry

```bash
# Build the image
docker build -t cofounder-api .

# Tag for Artifact Registry
docker tag cofounder-api us-central1-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/cofounder-api

# Push
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/cofounder-api

# Deploy
gcloud run deploy cofounder-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/cofounder-api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-key-here
```

> **Note:** On Cloud Run, the service account attached to the Cloud Run service must have Firestore access. No `GOOGLE_APPLICATION_CREDENTIALS` file is needed — Cloud Run uses Application Default Credentials automatically.

---

## Project Structure

```
co-founder_app_backend/
├── src/
│   ├── index.js              # Express server entry point
│   ├── config/
│   │   ├── firebase.js       # Firebase Admin SDK init
│   │   └── gemini.js         # Gemini 2.0 Flash client
│   └── routes/
│       ├── capture.js        # POST /api/capture
│       ├── commitments.js    # GET  /api/commitments
│       ├── conflicts.js      # GET  /api/conflicts
│       └── briefing.js       # GET  /api/briefing/:founder
├── Dockerfile                # Cloud Run container config
├── .env.example              # Environment variables template
├── .dockerignore
├── .gitignore
├── package.json
└── README.md
```
