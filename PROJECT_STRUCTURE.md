# 📁 Complete Project Structure

Visual guide to all files in the YouTube Sync project.

## 🌳 Full Directory Tree

```
youtube-jam/
│
├── 📄 START_HERE.md               ← Begin here! Navigation guide
├── 📄 README.md                   ← Main project documentation
├── 📄 QUICKSTART.md               ← 5-minute quick start
├── 📄 SETUP.md                    ← Detailed setup guide
├── 📄 DEPLOYMENT.md               ← Production deployment
├── 📄 ARCHITECTURE.md             ← Technical deep dive
├── 📄 PROJECT_SUMMARY.md          ← Complete overview
├── 📄 TROUBLESHOOTING.md          ← Problem solutions
├── 📄 PROJECT_STRUCTURE.md        ← This file
│
├── 📄 package.json                ← Root package (convenience scripts)
├── 📄 .gitignore                  ← Git ignore rules
├── 📜 install.sh                  ← Quick install script
│
├── 📁 server/                     ← BACKEND
│   ├── 📄 index.js               ← Main server (300+ lines)
│   │                                • Express server
│   │                                • Socket.io setup
│   │                                • Room management
│   │                                • Event handlers
│   │                                • CORS config
│   │
│   ├── 📄 package.json           ← Backend dependencies
│   │                                • express
│   │                                • socket.io
│   │                                • cors
│   │
│   ├── 📄 .env.example           ← Environment template
│   ├── 📄 .env                   ← Your config (create this)
│   ├── 📄 .gitignore             ← Backend ignore
│   ├── 📄 README.md              ← Backend docs
│   └── 📄 render.yaml            ← Render.com config
│
└── 📁 client/                     ← FRONTEND
    │
    ├── 📁 pages/                  ← Next.js pages
    │   ├── 📄 _app.tsx           ← App wrapper
    │   │                            • Global styles
    │   │                            • Head metadata
    │   │
    │   ├── 📄 _document.tsx      ← Custom document
    │   │                            • YouTube IFrame API loader
    │   │
    │   ├── 📄 index.tsx          ← Home page (200+ lines)
    │   │                            • Create room UI
    │   │                            • Join room UI
    │   │                            • Features showcase
    │   │
    │   └── 📁 room/
    │       └── 📄 [roomId].tsx   ← Room page (400+ lines)
    │                                • YouTube player
    │                                • Sync logic
    │                                • Drift correction
    │                                • Socket.io client
    │                                • Host controls
    │
    ├── 📁 components/             ← React components
    │   └── 📄 YouTubePlayer.tsx  ← YT Player (150+ lines)
    │                                • IFrame API integration
    │                                • Player initialization
    │                                • Event handlers
    │
    ├── 📁 lib/                    ← Utilities
    │   ├── 📄 socket.ts          ← Socket.io client
    │   │                            • Connection setup
    │   │                            • Reconnection logic
    │   │
    │   └── 📄 youtube.ts         ← YouTube helpers
    │                                • URL parsing
    │                                • Video ID extraction
    │                                • Time formatting
    │
    ├── 📁 styles/                 ← Styles
    │   └── 📄 globals.css        ← Global CSS + Tailwind
    │
    ├── 📁 public/                 ← Static files
    │   └── 📄 favicon.ico        ← App icon
    │
    ├── 📄 package.json           ← Frontend dependencies
    │                                • next
    │                                • react
    │                                • socket.io-client
    │                                • tailwindcss
    │                                • typescript
    │
    ├── 📄 next.config.js         ← Next.js config
    ├── 📄 tsconfig.json          ← TypeScript config
    ├── 📄 tailwind.config.js     ← Tailwind config
    ├── 📄 postcss.config.js      ← PostCSS config
    ├── 📄 vercel.json            ← Vercel deployment
    ├── 📄 .env.local.example     ← Environment template
    ├── 📄 .env.local             ← Your config (create this)
    ├── 📄 .gitignore             ← Frontend ignore
    └── 📄 README.md              ← Frontend docs
```

---

## 📊 File Categories

### Documentation (9 files)
- START_HERE.md - Navigation
- README.md - Overview
- QUICKSTART.md - Quick start
- SETUP.md - Setup guide
- DEPLOYMENT.md - Deploy guide
- ARCHITECTURE.md - Tech details
- PROJECT_SUMMARY.md - Summary
- TROUBLESHOOTING.md - Solutions
- PROJECT_STRUCTURE.md - This file

### Backend (7 files)
- index.js - Main server
- package.json - Dependencies
- .env.example - Config template
- .gitignore - Git rules
- README.md - Backend docs
- render.yaml - Deploy config
- .env - Your config (created by you)

### Frontend (17 files)
- 3 pages (_app, _document, index, [roomId])
- 1 component (YouTubePlayer)
- 2 lib utilities (socket, youtube)
- 1 style file (globals.css)
- 1 public file (favicon)
- 8 config files (package, next, ts, tailwind, etc.)

### Root (3 files)
- package.json - Optional scripts
- .gitignore - Git rules
- install.sh - Install script

**Total:** 36 files

---

## 🎯 Key Files Explained

### Must Read First
```
START_HERE.md          ← Start here for navigation
QUICKSTART.md          ← Get running in 5 minutes
```

### Backend Core
```
server/index.js        ← All backend logic here
  • Express routes
  • Socket.io events
  • Room management
  • User tracking
```

### Frontend Core
```
client/pages/room/[roomId].tsx    ← Main application logic
  • YouTube player integration
  • Socket.io client events
  • Drift correction algorithm
  • Sync state management
  • UI rendering
```

### Reusable Components
```
client/components/YouTubePlayer.tsx    ← YouTube player wrapper
  • IFrame API loader
  • Player initialization
  • Event handling
  • Props interface
```

### Utilities
```
client/lib/socket.ts        ← Socket.io client setup
client/lib/youtube.ts       ← YouTube helper functions
```

---

## 📝 Configuration Files

### Backend Config
```
server/.env                 ← Runtime config
  PORT=4000
  CLIENT_URL=http://localhost:3000
  NODE_ENV=development
```

### Frontend Config
```
client/.env.local           ← Runtime config
  NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Build Config
```
client/next.config.js       ← Next.js settings
client/tsconfig.json        ← TypeScript settings
client/tailwind.config.js   ← Tailwind settings
```

---

## 🔄 File Dependencies

### Backend Dependencies
```
index.js
  ├─ express          (web server)
  ├─ socket.io        (websockets)
  └─ cors             (CORS handling)
```

### Frontend Dependencies
```
pages/room/[roomId].tsx
  ├─ components/YouTubePlayer.tsx
  ├─ lib/socket.ts
  ├─ lib/youtube.ts
  └─ styles/globals.css

pages/index.tsx
  ├─ lib/youtube.ts
  └─ styles/globals.css
```

---

## 📦 Package Dependencies

### Backend (server/package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",      // Web framework
    "socket.io": "^4.6.1",     // WebSocket
    "cors": "^2.8.5"           // CORS
  },
  "devDependencies": {
    "nodemon": "^3.0.1"        // Auto-reload
  }
}
```

### Frontend (client/package.json)
```json
{
  "dependencies": {
    "next": "14.1.0",              // React framework
    "react": "^18.2.0",            // React
    "react-dom": "^18.2.0",        // React DOM
    "socket.io-client": "^4.6.1"   // WebSocket client
  },
  "devDependencies": {
    "typescript": "^5.3.3",        // TypeScript
    "tailwindcss": "^3.4.1",       // CSS framework
    "@types/react": "^18.2.48"     // React types
  }
}
```

---

## 🎨 Code Organization

### By Responsibility

**Server-Side (Backend):**
```
server/index.js
  ├─ HTTP Server (Express)
  ├─ WebSocket Server (Socket.io)
  ├─ Room Storage (Map)
  ├─ Event Handlers
  └─ REST Endpoints
```

**Client-Side (Frontend):**
```
client/
  ├─ Pages (routing)
  ├─ Components (reusable UI)
  ├─ Lib (utilities)
  └─ Styles (CSS)
```

### By Feature

**Room Management:**
- server/index.js (backend storage)
- client/pages/index.tsx (create/join UI)
- client/pages/room/[roomId].tsx (room page)

**YouTube Player:**
- client/components/YouTubePlayer.tsx (player component)
- client/lib/youtube.ts (helper functions)

**Real-time Sync:**
- server/index.js (event broadcasting)
- client/lib/socket.ts (connection)
- client/pages/room/[roomId].tsx (sync logic)

**UI/UX:**
- client/pages/index.tsx (home page)
- client/pages/room/[roomId].tsx (room page)
- client/styles/globals.css (styles)

---

## 🔍 Finding Specific Code

### "Where is the sync logic?"
```
client/pages/room/[roomId].tsx
  • handleStateChange()      (line ~200)
  • Drift correction         (line ~150)
  • Socket event listeners   (line ~100)
```

### "Where are Socket.io events defined?"
```
server/index.js
  • join-room     (line ~80)
  • play          (line ~120)
  • pause         (line ~130)
  • seek          (line ~140)
  • sync-time     (line ~160)
```

### "Where is the YouTube player initialized?"
```
client/components/YouTubePlayer.tsx
  • useEffect hook   (line ~50)
  • new YT.Player()  (line ~60)
```

### "Where are rooms stored?"
```
server/index.js
  • const rooms = new Map()  (line ~30)
  • Room structure           (line ~35 comment)
```

---

## 🎯 File Sizes (Approximate)

### Large Files (100+ lines)
- server/index.js (~300 lines)
- client/pages/room/[roomId].tsx (~400 lines)
- client/pages/index.tsx (~250 lines)
- client/components/YouTubePlayer.tsx (~150 lines)

### Medium Files (50-100 lines)
- Documentation files (~50-200 lines each)
- Config files (~20-50 lines)

### Small Files (< 50 lines)
- client/lib/socket.ts (~30 lines)
- client/lib/youtube.ts (~40 lines)
- client/pages/_app.tsx (~20 lines)
- client/pages/_document.tsx (~15 lines)

---

## 🗂️ What Each Directory Does

### `/server` - Backend
**Purpose:** Handle WebSocket connections, manage rooms, broadcast events

**Key files:**
- index.js - Main server logic

### `/client/pages` - Routes
**Purpose:** Define URL routes and page components

**Routes:**
- `/` → index.tsx (home)
- `/room/[id]` → room/[roomId].tsx (room)

### `/client/components` - Reusable UI
**Purpose:** Shared React components

**Components:**
- YouTubePlayer - Video player wrapper

### `/client/lib` - Utilities
**Purpose:** Helper functions and utilities

**Utilities:**
- socket.ts - WebSocket client
- youtube.ts - YouTube helpers

### `/client/styles` - CSS
**Purpose:** Global styles and Tailwind setup

### `/client/public` - Static Assets
**Purpose:** Images, icons, static files

---

## 📚 Documentation Map

### Getting Started
1. START_HERE.md - Begin here
2. QUICKSTART.md - Run in 5 min
3. SETUP.md - Detailed setup

### Understanding
4. README.md - Feature overview
5. ARCHITECTURE.md - How it works
6. PROJECT_SUMMARY.md - Complete summary

### Operations
7. DEPLOYMENT.md - Deploy to production
8. TROUBLESHOOTING.md - Fix issues

### Reference
9. PROJECT_STRUCTURE.md - This file
10. server/README.md - Backend docs
11. client/README.md - Frontend docs

---

## 🎓 Learning Path

### To Understand Backend:
```
1. server/index.js
2. ARCHITECTURE.md (backend section)
3. server/README.md
```

### To Understand Frontend:
```
1. client/pages/index.tsx
2. client/pages/room/[roomId].tsx
3. client/components/YouTubePlayer.tsx
4. ARCHITECTURE.md (frontend section)
```

### To Understand Sync Logic:
```
1. client/pages/room/[roomId].tsx (drift correction)
2. server/index.js (event handlers)
3. ARCHITECTURE.md (algorithms section)
```

---

## 🔧 Files You'll Edit Most

### Development:
- `server/index.js` - Add backend features
- `client/pages/room/[roomId].tsx` - Add frontend features
- `client/components/YouTubePlayer.tsx` - Modify player
- `client/styles/globals.css` - Change styles

### Configuration:
- `server/.env` - Backend settings
- `client/.env.local` - Frontend settings

### Documentation:
- `README.md` - Update features
- Add your own docs as needed

---

## 📊 Project Statistics

```
Total Files:        36
Documentation:      9 files
Source Code:        19 files
Configuration:      8 files

Total Lines:        ~3,000+
Backend:            ~300 lines
Frontend:           ~900 lines
Documentation:      ~1,800 lines

Languages:
  - TypeScript      ~60%
  - JavaScript      ~20%
  - Markdown        ~15%
  - JSON/Config     ~5%
```

---

**📁 Now you know where everything is! Happy coding! 🚀**
