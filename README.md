🔍 Project: FindMyStuff (Lost & Found System)
Developed/Modified by: Yogendra

Full-stack working application
A centralized platform for reporting, tracking, and recovering lost items within a campus environment.

---

📖 Overview
FindMyStuff is a full-stack web application designed to streamline the process of reporting and recovering lost and found items on campus. The platform connects students and administrators through a unified interface, enabling efficient item management, real-time communication, and intelligent matching between lost and found reports.

Whether a student misplaced their laptop in the library or found a wallet on the sports field, FindMyStuff provides the tools to reunite items with their rightful owners quickly and transparently.

---

🎓 Academic Context
This project was developed for the IT3040 – ITPM module as a university project.

---

✨ Features

| Feature                       | Description                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| 🧑‍💼 User Profile Management | Manage personal profiles, preferences, and notification settings     |
| 📦 Lost Item Reporting        | Submit detailed reports for lost items with images and location data |
| 🔎 Found Item Reporting       | Log found items and notify the campus community                      |
| 🤝 Item Claim & Verification  | Secure claim submission and admin-verified handover workflow         |
| 🔔 Notifications & Alerts     | Real-time in-app notifications for claim updates and item matches    |
| 💬 In-App Messaging           | Direct messaging between finders and claimants                       |
| 🤖 Chatbot Assistant          | AI-powered assistant to guide users through the reporting process    |
| 🔗 Smart Matching             | Automated suggestion of matched lost & found posts                   |
| 🔍 Search & Filter            | Advanced filtering by category, date, location, and status           |
| 🏆 Leaderboard                | Gamification system rewarding active community contributors          |
| 📢 Admin Notices              | Broadcast important announcements to all users                       |
| 🚨 Report & Moderation        | Content moderation tools for administrators                          |

---

👥 Team & Contributions

| Member               | Contributions                                                                |
| -------------------- | ---------------------------------------------------------------------------- |
| Lakvindu K L C       | User Profile Management · Item Claim & Verification · Notifications & Alerts |
| Herath H.M.H.N       | Found Item Reporting · Admin Notices · Chatbot Assistant                     |
| Sithumini D.M.A      | In-App Messaging · Leaderboard · Report & Moderation                         |
| Kumarasinghe I.D.D.H | Lost Item Reporting · Search & Filter · Matching Post Suggestion             |

---

🛠️ Tech Stack

Frontend

* React 19
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* Socket.IO Client
* Lucide React

Backend

* Node.js + Express 5
* MongoDB + Mongoose
* Socket.IO
* JWT Authentication
* bcryptjs
* Multer
* Google Generative AI (Gemini)
* node-cron

---

🏗️ Project Structure

FindMyStuff/
├── backend/
├── frontend/
└── e2e/

---

🔌 API Endpoints Overview

* /api/auth → Authentication
* /api/users → User management
* /api/lost → Lost items
* /api/found → Found items
* /api/claims → Claims
* /api/messages → Messaging
* /api/notifications → Notifications

---

🚀 Getting Started

Prerequisites

* Node.js v18+
* MongoDB (local or Atlas)
* npm

---

1. Clone the Repository

git clone https://github.com/yk1082420-ai-ml2025/FindMyStuff.git

---

2. Configure Environment Variables

Create `.env` inside backend/

PORT=5000
MONGO_DB_URI=your_mongodb_connection_string
DB_NAME=FindMyStuff
JWT_SECRET=your_secret_key

---

3. Install Dependencies

Backend:
cd backend
npm install

Frontend:
cd frontend
npm install

---

4. Run the Application

Backend:
cd backend
npm start

Frontend:
cd frontend
npm run dev

---

Application runs at:
http://localhost:5173

---
