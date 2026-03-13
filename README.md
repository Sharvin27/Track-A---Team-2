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

Database (planned)
- PostgreSQL / Supabase

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
