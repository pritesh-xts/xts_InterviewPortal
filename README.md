# Interview Hub

## Project Structure

```
xts_InterviewPortal/
├── backend/          # PHP Backend API
│   ├── api/         # API endpoints
│   ├── config.php   # Configuration
│   └── uploads/     # File uploads
├── frontend/        # React Frontend
│   ├── src/         # React components
│   └── .env         # Environment variables
└── README.md
```

## Running the Application

### Terminal 1 - Backend (PHP Server)
```bash
cd backend
npm start
```
This starts the PHP server on http://localhost:8000

### Terminal 2 - Frontend (React + Vite)
```bash
cd frontend
npm start
```
This starts the Vite dev server (usually on http://localhost:5173)

## Important
Both servers must be running simultaneously for the application to work properly.
