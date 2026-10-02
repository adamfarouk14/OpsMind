# OpsMind

A web-based Knowledge Management System built for the Technical Support Department as part of my final year project at Nilai University.

The idea came from a real problem I noticed at work — technical information was scattered across different places. SOPs were stored separately, solutions were shared through messages, and some procedures existed only through personal experience. OpsMind aims to bring this knowledge together in one centralized platform where the team can store, find, manage, and share technical and operational knowledge.

---

## What it does

* Create and manage SOPs, technical documents, operational cases, and organizational information
* Submit documents for approval and track their status through a review workflow
* Version control — track document changes and maintain previous versions with notes
* Centralized search across different document types
* AI assistant powered by Google Gemini that searches the knowledge base and answers questions based on stored documents
* Activity logs for tracking actions performed within the system
* Role-based access — Admin, Manager, and Support Agent have different permissions
* Notifications when documents are submitted for review, approved, or rejected

---

## Tech Stack

* **React + TypeScript** — frontend
* **Tailwind CSS** — styling
* **shadcn/ui** — UI components
* **Supabase** — database, authentication, and file storage
* **Google Gemini API** — AI-powered knowledge retrieval

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/adamfarouk14/OpsMind.git
cd OpsMind
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add the required credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

The `.env` file is not included in the repository and should not be committed to GitHub.

### 4. Run the application

```bash
npm run dev
```

The application will be available at the local development URL shown in the terminal.

---

## Database

OpsMind uses **Supabase** for its database, authentication, and file storage.

The application requires the following tables:

* `roles`
* `users`
* `documents`
* `document_versions`
* `approvals`
* `activity_logs`
* `notifications`

The Supabase database must have the required tables, relationships, authentication configuration, and access policies configured before running the application.

### Storage

File uploads are stored in a Supabase Storage bucket named:

```text
documents
```

---

## Role-Based Access

OpsMind uses three main roles:

* **Admin** — manages users and has access to all system features
* **Manager** — manages and reviews documents and related operational activities
* **Support Agent** — accesses and manages knowledge relevant to technical support operations

Access to features and data is controlled according to the user's assigned role.

---

## Project Structure

```text
src/
├── pages/          # Application pages
├── components/     # Layout and shared UI components
├── services/       # Supabase query and service functions
├── contexts/       # React contexts, including authentication
├── types/          # TypeScript types matching the application data model
└── lib/            # Supabase client and supporting utilities
```

---

## Environment Variables

The following environment variables are required:

| Variable                 | Description                        |
| ------------------------ | ---------------------------------- |
| `VITE_SUPABASE_URL`      | URL of the Supabase project        |
| `VITE_SUPABASE_ANON_KEY` | Supabase client authentication key |
| `VITE_GEMINI_API_KEY`    | Google Gemini API key              |

**Important:** Do not commit `.env` or any file containing API keys or other credentials to GitHub.

---

## Project Information

**OpsMind: Enterprise Knowledge and Operations Platform**

**Student:** Adam Mohamed Farouk

**Program:** Bachelor of Software Engineering (Honours)

**University:** Nilai University

**Project:** SE Project - OEC3328
