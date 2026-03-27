# FitAI - Smart Virtual Trainer

FitAI is a full-stack AI-powered fitness assistant for gym users and home workout users. It supports the full workflow:

1. User logs in
2. Sets goals and profile
3. Starts workout session
4. Tracks exercises, sets, reps, and duration
5. AI suggests the next exercise
6. Guidance video is shown
7. Progress and rewards are updated
8. Repeat cycle

## Tech Stack

- Frontend: React + Tailwind CSS + React Router + Chart.js
- Backend: Node.js + Express
- Database: MongoDB with Mongoose
- AI logic: Rule-based recommendation engine designed for future LLM extension
- Exercise guidance: Seeded YouTube embeds with YouTube API fallback support

## Project Structure

```text
fitai/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── DietPlan.js
│   │   ├── Exercise.js
│   │   ├── Progress.js
│   │   ├── Reward.js
│   │   ├── User.js
│   │   └── Workout.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── diet.js
│   │   ├── progress.js
│   │   ├── rewards.js
│   │   └── workouts.js
│   ├── services/
│   │   ├── analytics.js
│   │   ├── dietEngine.js
│   │   └── recommendationEngine.js
│   ├── .env.example
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Diet.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Progress.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── StartWorkout.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── session.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── .env.example
└── README.md
```

## Core Modules

### 1. Auth Module

- Signup and login
- User profile with age, weight, height, goal, activity level, location
- Preferences for workout days, session duration, and diet style

### 2. Workout Module

- Start workout session endpoint
- Track exercises, sets, reps, duration, and weight
- Save daily workout logs
- Support gym mode and home workout mode

### 3. AI Recommendation Engine

- Uses goal, location, activity level, and recent workout history
- Avoids repeating the same exercises too often
- Returns a plan, AI summary, and next suggested exercise

### 4. Exercise Guidance

- Uses stored YouTube IDs for fast demo-ready embeds
- Supports YouTube API lookup when `YOUTUBE_API_KEY` is configured

### 5. Diet Planner

- Calculates BMI
- Adjusts calories based on fat loss, muscle gain, or maintenance
- Generates meals, macros, hydration target, and coach notes

### 6. Progress Module

- Weight graph
- Workout consistency chart
- Performance and body measurement logs

### 7. Reward Module

- Streak tracking
- Reward points
- 7-day and 30-day badge logic

## Database Collections

- `users`
- `workouts`
- `exercises`
- `dietplans`
- `progresses`
- `rewards`

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### Workouts

- `GET /api/workouts`
- `GET /api/workouts/exercises`
- `GET /api/workouts/recommendations`
- `POST /api/workouts/session/start`
- `POST /api/workouts`
- `GET /api/workouts/guidance/:exerciseId`

### Diet

- `GET /api/diet`
- `POST /api/diet/generate`

### Progress

- `GET /api/progress`
- `POST /api/progress`

### Rewards

- `GET /api/rewards`
- `POST /api/rewards/refresh`

## Environment Setup

### Backend `.env`

Copy `backend/.env.example` to `backend/.env`.

### Frontend `.env`

Copy `frontend/.env.example` to `frontend/.env`.

## Run Locally

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Verification

- Frontend production build completed successfully with `npm run build`
- Backend route files passed `node --check`

## Future AI Extension

The recommendation and diet engines are isolated in `backend/services/`. This makes it straightforward to replace rule-based logic with an LLM or external AI service later without changing the React pages or core route structure.
