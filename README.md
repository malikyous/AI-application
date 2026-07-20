# AI Chat Application

A full-stack real-time AI chat application built with **React** (frontend) and **Flask** (backend).

## Features

- **Real-time chat** — WebSocket-powered instant messaging via Flask-SocketIO
- **AI assistant** — OpenAI GPT integration for intelligent responses
- **Chat history** — Persistent conversations stored in SQLite
- **File upload** — Upload text, PDF, images, and documents for AI analysis

## Project Structure

```
AI-chat application/
├── backend/
│   ├── app.py              # Flask server + SocketIO + API routes
│   ├── models.py           # SQLAlchemy database models
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── uploads/            # Uploaded files directory
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── api.js          # REST API client
│   │   ├── hooks/
│   │   │   └── useSocket.js  # WebSocket hook
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MessageList.jsx
│   │   │   └── MessageInput.jsx
│   │   └── styles/
│   │       └── App.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key (optional, for AI responses)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
# Edit .env and add your OPENAI_API_KEY

# Run server
python app.py
```

Backend runs at `http://localhost:5000`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/sessions` | List all chat sessions |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/:id` | Get session with messages |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/upload` | Upload file to session |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_session` | Client → Server | Join a chat room |
| `send_message` | Client → Server | Send a message |
| `new_message` | Server → Client | New message received |
| `ai_typing` | Server → Client | AI is generating response |
| `ai_done` | Server → Client | AI response complete |

## Supported File Types

`.txt`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.doc`, `.docx`, `.csv`, `.json`, `.md`

## Tech Stack

- **Frontend:** React 18, Vite, Socket.IO Client, React Markdown
- **Backend:** Flask, Flask-SocketIO, Flask-SQLAlchemy, OpenAI API
- **Database:** SQLite
- **Real-time:** WebSockets (Socket.IO)
