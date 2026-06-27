# 🚀 AI Job Search Platform

An AI-powered job search automation platform that helps users discover relevant jobs, optimize resumes for ATS, and manage applications efficiently.

---

## ✨ Features

### 🔐 Authentication
- User Registration & Login
- JWT Authentication
- Protected Routes
- User Profile Management

### 📄 Resume Management
- Upload Resume (PDF/DOCX)
- AI Resume Parsing (Gemini)
- Google Drive Storage
- Resume CRUD Operations

### 💼 Job Management
- Search Jobs
- Store Jobs
- Track Application Status
- Job Dashboard
- Job Preferences

### 🤖 AI Resume Optimization
- ATS Score Generation
- Missing Keywords Detection
- Resume Suggestions
- Optimized Resume Generation
- PDF Resume Generation (LaTeX)

### 📊 Dashboard
- Job Statistics
- Resume Analytics
- Application Tracking

### ☁ Cloud Integrations
- Supabase Database
- Google Drive API
- Gemini AI API
- Gmail API
- Apify Job Scraper

---

# 🏗 Tech Stack

## Frontend
- React
- Vite
- React Router
- React Query
- Axios

## Backend
- Node.js
- Express.js
- Multer
- JWT
- pdf-parse
- Mammoth

## Database
- Supabase

## AI
- Google Gemini

## Cloud Services
- Google Drive API
- Gmail API

## Job Scraping
- Apify

---

# 📁 Project Structure

```
AI-Job-search/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── App.jsx
│
├── public/
├── package.json
└── README.md
```

---

# ⚙ Prerequisites

- Node.js 20+
- npm
- Supabase Account
- Google Cloud Project
- Gemini API Key
- Apify Account
- MiKTeX (Windows) / TeX Live (Linux/macOS)

---

# 🔑 Environment Variables

## Backend

Create

```
backend/.env
```

Required variables

```env
PORT=3001

CLIENT_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

GEMINI_API_KEY=

GOOGLE_APPLICATION_CREDENTIALS=

GOOGLE_DRIVE_FOLDER_ID=

APIFY_API_TOKEN=

GMAIL_USER=
GMAIL_APP_PASSWORD=
```

> **Do not commit your `.env` file or credentials to Git.**

---

# 📦 Installation

## Clone Repository

```bash
git clone https://github.com/<username>/AI-Job-search.git

cd AI-Job-search
```

---

## Install Frontend

```bash
npm install
```

---

## Install Backend

```bash
cd backend

npm install
```

---

# ▶ Running the Project

## Backend

```bash
cd backend

npm run dev
```

Backend runs on

```
http://localhost:3001
```

---

## Frontend

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# 🗄 Database

Run

```
supabase-schema.sql
```

inside the Supabase SQL Editor.

This creates:

- profiles
- resumes
- jobs
- job_preferences
- optimized_resumes
- workflow_logs

---

# 📡 API Endpoints

## Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## Resume

```
POST   /api/upload/resume

GET    /api/resumes

PATCH  /api/resumes/:id

DELETE /api/resumes/:id
```

---

## Jobs

```
GET    /api/jobs

POST   /api/jobs

PATCH  /api/jobs/:id

DELETE /api/jobs/:id
```

---

## Dashboard

```
GET /api/dashboard/stats

GET /api/dashboard/analytics
```

---

## Job Scraper

```
GET /api/scrape/jobs
```

---

## Resume Optimization

```
POST /api/optimize/:jobId

POST /api/optimize/batch
```

---

## Email

```
POST /api/email/send
```

---

# 🚀 Deployment

The project is prepared for deployment on **Render**.

Deployment configuration includes:

- render.yaml
- Production environment support
- Static frontend serving
- Health endpoint
- Environment variable support

---

# 🔒 Security

- JWT Authentication
- Protected Routes
- Supabase RLS
- Secure File Upload Validation
- Environment Variables
- Google Service Account Authentication

---

# 📈 Future Improvements

- n8n Workflow Automation
- Automatic Daily Job Search
- AI Cover Letter Generation
- Resume Versioning
- Job Recommendation Engine
- Interview Preparation AI
- Analytics Dashboard
- Notifications

---

# 👨‍💻 Author

**Swapnil Doddi**

- GitHub: https://github.com/<your-username>
- LinkedIn: https://linkedin.com/in/<your-linkedin>

---

# 📄 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.
