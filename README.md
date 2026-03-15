# Track-A---Team-2
Morgan Stanley Hackathon - Lemontree

# Track A – Team 2  
### Lemontree Flyering Platform

This project is built for the hackathon to improve the flyering workflow for Lemontree volunteers.  
The platform helps volunteers identify high-impact locations to distribute flyers and helps people quickly find nearby food resources.

The goal is to make flyering more effective and accessible by combining:
- smart mapping
- multilingual flyers
- volunteer coordination
- AI-assisted resource discovery

---

# Project Overview

The platform helps two groups:

### Volunteers
- find good locations to distribute flyers
- identify areas with higher pedestrian traffic
- coordinate flyering with other volunteers

### People in Need
- scan a flyer
- quickly find nearby food resources
- access information in multiple languages

---

# Tech Stack

Frontend
- Next.js
- React
- Tailwind CSS

Backend
- Node.js
- Express

Database
- PostgreSQL (used for user accounts; see Auth & Database below)

Deployment
- Vercel (frontend)

---

# Repository Structure


project
├── frontend
│ ├── app
│ ├── components
│ └── package.json
│
├── backend
│ ├── src
│ │ ├── routes
│ │ ├── controllers
│ │ └── data
│ └── package.json
│
├── .gitignore
└── README.md


---

# Getting Started

Follow these steps to run the project locally.

---

# 1 Clone the Repository


git clone https://github.com/Sharvin27/Track-A---Team-2.git

cd Track-A---Team-2


---

# 2 Install Dependencies

## Frontend


cd frontend
npm install


## Backend

Open a new terminal.


cd backend
npm install


---

# Running the Project

You need **two terminals**.

---

## Start the Frontend


cd frontend
npm run dev


Frontend runs at:


http://localhost:3000


---

## Start the Backend

Open another terminal:


cd backend
npm run dev


Backend runs at:


http://localhost:5001


---

# Auth & Database

User accounts are stored in **PostgreSQL**. Passwords are hashed with **bcrypt** (never stored in plain text). The backend uses **JWT** for session tokens.

## Setup (local PostgreSQL)

1. **PostgreSQL**: Create a database (e.g. `lemontree`) and set `DATABASE_URL` in the backend.

2. **Backend env**: In `backend/`, copy `.env.example` to `.env` and set:
   - `DATABASE_URL=postgresql://user:password@localhost:5432/lemontree`
   - `JWT_SECRET` — use a long random string in production.

3. **Frontend env** (optional): In `frontend/`, copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:5001` if your API runs elsewhere.

4. **First run**: When the backend starts, it creates the `users` table if it does not exist.

## Using Supabase

1. **Create a project**: Go to [supabase.com](https://supabase.com) → New project → pick org, name, DB password, region.

2. **Get the connection string**: In the Supabase dashboard → **Project Settings** (gear) → **Database** → under **Connection string** choose **URI**. Copy the URI and replace `[YOUR-PASSWORD]` with your database password.

3. **Backend `.env`**: In `backend/`, set:
   - `DATABASE_URL=<paste the Supabase connection string>`
   - `JWT_SECRET=<a long random string>` (Supabase does not provide JWT for this app; we use our own.)

4. **Start the backend**: Run `npm run dev` in `backend/`. The app will connect with SSL and create the `users` table in your Supabase database on first run.

No code changes are required—only `DATABASE_URL` points to Supabase instead of local Postgres.

## Security

- Passwords are hashed with bcrypt (12 rounds) before storage.
- Only the hash is stored; the API never returns `password_hash`.
- JWT tokens are used for authenticated requests; set `JWT_SECRET` to a strong value in production.

---

# Git Workflow

To avoid conflicts, **do NOT push directly to the main branch.**

Always create a new branch when working on a feature.

---

## Create a new branch


git checkout -b feature/your-feature-name


Example:


git checkout -b feature/map-page


---

## Commit your changes


git add .
git commit -m "describe your changes"


---

## Push your branch


git push origin feature/your-feature-name


Then open a **Pull Request on GitHub**.

---

# Updating Your Local Repository

Before starting work, pull the latest code.


git checkout main
git pull origin main


Then create your feature branch.
