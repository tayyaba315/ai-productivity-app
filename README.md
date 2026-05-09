# Align AI - Student Productivity Website

Align AI is a modern, full-stack student productivity application designed to help students seamlessly manage their schedules, classes, tasks, and communications. Powered by AI and the MERN stack, Align AI acts as your personal digital assistant.

##  Features

- **Smart AI Assistant**: Powered by Google Gemini, the chatbot can read your calendar, answer complex scheduling questions, and autonomously create tasks or schedule meetings for you.
- **Google Calendar Integration**: Connect your Google account via OAuth to pull in your external events and automatically sync new events scheduled by the AI.
- **Smart Email Summarizer**: Automatically generate concise, easy-to-read summaries of your emails using Gemini AI.
- **Dynamic Theming**: Fully customizable appearance with smooth dark mode options including Default Dark, Dark Green, Dark Pink, and Dark Blue.
- **Secure Authentication**: Built-in user authentication using JWT (JSON Web Tokens) and secure bcrypt password hashing.
- **Productivity Dashboard**: Track classroom pending work, manage tasks, search for jobs, and catch up on daily news all in one beautiful interface.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Shadcn UI
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **AI Integration**: Google Generative AI (Gemini Flash Latest)
- **Authentication**: JWT, bcrypt, Google OAuth

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kainattkk/AlignAI-Student-Productivity-Website.git
   cd align-ai
   ```

2. **Setup the Backend**
   Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables (Backend)**
   Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_ORIGIN=http://localhost:5173
   
   # Google OAuth & API Credentials
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Setup the Frontend**
   Open a new terminal window, navigate to the frontend directory, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

You will need two terminal windows to run both the frontend and backend servers simultaneously.

**Start the Backend Server:**
```bash
cd backend
node server.js
# Runs on http://localhost:5000
```

**Start the Frontend Development Server:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser to start using Align AI!

## Project Structure

```
align-ai/
├── backend/               # Node.js + Express backend
│   ├── config/            # Database and environment configurations
│   ├── models/            # Mongoose schemas (User, Setting, Task, Event, etc.)
│   ├── routes/            # API endpoints (auth, settings, calendar, integrations)
│   ├── services/          # External API services (Google OAuth)
│   └── server.js          # Entry point for the backend server
│
├── frontend/              # React + Vite frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── app/           # Context providers (Auth, Theme)
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application views (Dashboard, Settings, Email, etc.)
│   │   ├── lib/           # Utilities and API helpers
│   │   ├── App.tsx        # Main application routing
│   │   └── index.css      # Global styles and Tailwind theming
│   └── package.json
│
└── README.md              # Project documentation
```

## Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
