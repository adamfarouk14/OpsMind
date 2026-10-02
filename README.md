# OpsMind

A web-based Knowledge Management System built for the Technical Support Department as part of my final year project at Nilai University.

The idea came from a real problem I noticed at work — technical information was scattered everywhere. SOPs in one place, solutions in messages, procedures in someone's head. OpsMind is my attempt to fix that by giving the team one place to store, find, and manage all of it.

---

## What it does

- Create and manage SOPs, technical documents, operational cases, and org info
- Submit documents for approval and track their status through a review workflow
- Version control — every document change is tracked with notes
- Centralized search across all document types
- AI assistant (powered by Google Gemini) that searches the knowledge base and answers questions based on stored documents
- Activity logs for every action in the system
- Role-based access — Admin, Manager, and Support Agent each have different permissions
- Notifications when documents are approved, rejected, or submitted for review

---

## Tech stack

- **React + TypeScript** — frontend
- **Tailwind CSS** — styling
- **shadcn/ui** — UI components
- **Supabase** — database, authentication, and file storage
- **Google Gemini API** — AI knowledge retrieval

---

## Getting started

1. Clone the repo
2. Install dependencies

```bash
npm install
```

3. The `.env` file is already configured and committed for this project's Supabase instance. No additional setup is needed — just install and run.

4. Run the app

```bash
npm run dev
```

---

## Database setup

The app requires these tables in Supabase: `roles`, `users`, `documents`, `document_versions`, `approvals`, `activity_logs`, `notifications`.

Make sure Row Level Security is disabled on all tables, or configure the policies to allow authenticated access.

---

## Project structure

```
src/
├── pages/          # All page components
├── components/     # Layout and shared UI components
├── services/       # Supabase query functions
├── contexts/       # Auth context
├── types/          # TypeScript types matching the DB schema
└── lib/            # Supabase client setup
```

---

## Notes

- File uploads are stored in a Supabase Storage bucket named `documents`.
- Default roles are Admin, Manager, and Support Agent. Admins can manage users and access all pages.

---

Adam Mohamed Farouk  
Bachelor of Software Engineering — Nilai University  
SE Project — OEC3328
