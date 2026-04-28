# ⚡ CrisisCore — Hospitality Emergency Management Platform
### AI-Powered Rapid Crisis Response Coordinator (MERN Stack)

---

<img width="1919" height="915" alt="Screenshot 2026-04-28 154331" src="https://github.com/user-attachments/assets/384014e4-9a17-462c-84bf-90422fbfe04d" />


## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (optional — app works in demo mode without it)

### Installation

```bash
# 1. Clone / open project folder
cd "Solution Challenege Project"

# 2. Install root dependencies
npm install

# 3. Install server dependencies
cd server && npm install && cd ..

# 4. Install client dependencies
cd client && npm install && cd ..

# 5. Start both servers simultaneously
npm run dev
```

- **Frontend (React/Vite):** http://localhost:5173
- **Backend API (Express):** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

---

## 🔑 Demo Login Credentials

| Role | Staff ID | Password |
|------|---------|----------|
| Crisis Manager | MGR001 | crisis2024 |
| Security Officer | SEC001 | crisis2024 |
| Medical Staff | MED001 | crisis2024 |
| Front Desk | FD001 | crisis2024 |
| Engineer | ENG001 | crisis2024 |

> **Guest Portal:** Enter any room number (e.g. `412`) — no password needed.

---

## 📦 Tech Stack

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Persistent incident & staff storage |
| Socket.IO | Real-time bidirectional communication |
| JWT + bcryptjs | Authentication & security |
| In-memory fallback | Works without MongoDB |

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite | UI framework & build tool |
| React Router v6 | Client-side routing |
| Socket.IO Client | Real-time event handling |
| Axios | HTTP API calls |
| React Hot Toast | Toast notifications |
| date-fns | Date formatting |
| Canvas API | Floor map rendering |

---

## 🏗️ Project Structure

```
Solution Challenege Project/
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── StaffLayout.jsx    # Sidebar + topbar layout
│   │   │   └── CrisisBanner.jsx   # Active incident banner
│   │   ├── context/
│   │   │   └── AppContext.jsx     # Global state + Socket.IO
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx      # Staff + guest login
│   │   │   ├── Dashboard.jsx      # Live crisis dashboard
│   │   │   ├── ReportIncident.jsx # AI classification + dispatch
│   │   │   ├── Coordination.jsx   # Staff tasks + action log
│   │   │   ├── Communications.jsx # Real-time multi-channel chat
│   │   │   ├── FloorMap.jsx       # Canvas-drawn venue maps
│   │   │   ├── IncidentHistory.jsx# Searchable incident archive
│   │   │   ├── Settings.jsx       # System configuration
│   │   │   └── GuestPortal.jsx    # Guest SOS + safety info
│   │   ├── App.jsx                # Routes + auth guards
│   │   ├── main.jsx               # React entry
│   │   └── index.css              # Full design system
│   └── package.json
│
├── server/                  # Node.js + Express Backend
│   ├── models/
│   │   ├── Incident.js            # Full incident schema
│   │   ├── User.js                # Staff user schema
│   │   └── Message.js             # Communication log schema
│   ├── routes/
│   │   ├── auth.js                # Login, logout, JWT
│   │   ├── incidents.js           # CRUD + AI dispatch
│   │   ├── messages.js            # Channel messages
│   │   ├── staff.js               # Staff roster & status
│   │   └── alerts.js              # Guest alerts, distress, EMS
│   ├── middleware/
│   │   └── auth.js                # JWT verification
│   ├── utils/
│   │   └── aiClassifier.js        # AI crisis classification engine
│   ├── server.js                  # Main app + Socket.IO hub
│   └── .env                       # Environment variables
│
└── package.json             # Root scripts (concurrently)
```

---

## 🤖 AI Crisis Classification

The AI engine classifies any plain-language text input:

```
"There is smoke coming from Room 412"
→ crisisType: fire | severity: critical | location: {room: "412"} | confidence: 87%

"A guest has collapsed in the lobby and is unresponsive"
→ crisisType: medical | severity: critical | location: {zone: "Lobby"} | confidence: 82%

"Someone is threatening guests near the pool area"
→ crisisType: security | severity: high | location: {zone: "Pool"} | confidence: 78%
```

---

## 🔌 Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `newIncident` | Server → All | Broadcasts new incident |
| `incidentUpdated` | Server → All | Status/responder updates |
| `guestDistress` | Server → Staff | Guest SOS signal |
| `hotelAlert` | Server → Guests | Hotel-wide notifications |
| `newMessage` | Bidirectional | Channel messages |
| `staffOnline` | Server → All | Staff presence list |
| `staffStatusUpdate` | Server → All | Individual status change |

---

## 🔒 Security & Compliance

- **JWT Authentication** — 12h expiry, role-based access
- **GDPR Compliance** — PII anonymization settings
- **Full Audit Logs** — Every action timestamped and logged
- **Offline Queue** — Messages queued during network failures
- **Role-Based Access** — Manager, Security, Medical, FrontDesk, Housekeeping, Engineering, Guest

---

## 📊 Key Features Checklist

- [x] AI-powered crisis classification from natural language
- [x] Severity scoring (Critical/High/Moderate/Low)
- [x] Automatic responder assignment by crisis type
- [x] Real-time Socket.IO dashboard updates
- [x] Multi-channel communications (Staff, Security, Medical, Guests)
- [x] Guest distress SOS one-tap signal
- [x] Canvas-drawn interactive floor maps  
- [x] Evacuation routes per floor
- [x] Post-incident auto-generated reports
- [x] Searchable incident history + CSV export
- [x] Staff task management with status tracking
- [x] In-memory fallback (works without MongoDB)
- [x] Responsive design for mobile/tablet
- [x] Premium dark mode UI with animations
