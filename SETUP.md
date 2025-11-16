# 🛠️ Complete Setup Guide

Step-by-step instructions to get YouTube Sync running locally.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** 18.0.0 or higher ([Download](https://nodejs.org))
- ✅ **npm** (comes with Node.js) or **yarn**
- ✅ **Git** ([Download](https://git-scm.com))
- ✅ A code editor (VS Code recommended)
- ✅ Two browser windows/tabs (for testing sync)

### Verify Prerequisites

```bash
node --version   # Should be v18.0.0 or higher
npm --version    # Should be 9.0.0 or higher
git --version    # Any recent version
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
# If you haven't cloned yet
cd ~/Desktop  # or your preferred location
git clone <your-repo-url>
cd youtube-jam
```

If you already have the files:
```bash
cd youtube-jam
```

### Step 2: Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the server
npm run dev
```

**Expected output:**
```
🚀 Server running on port 4000
📡 Socket.io ready for connections
🌍 Environment: development
```

✅ **Backend is running!** Keep this terminal open.

### Step 3: Setup Frontend (New Terminal)

Open a **new terminal window/tab**:

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Start the development server
npm run dev
```

**Expected output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

✅ **Frontend is running!** Keep this terminal open too.

### Step 4: Open and Test

1. **Open Browser:** Navigate to [http://localhost:3000](http://localhost:3000)

2. **Create a Room:**
   - Click "Create Room"
   - You'll be redirected to a room page

3. **Test Sync (Important!):**
   - Copy the room URL
   - Open in incognito window or different browser
   - Play/pause the video in one window
   - Verify it syncs in the other window

🎉 **If playback syncs, everything is working!**

---

## 📂 Project Structure Overview

```
youtube-jam/
│
├── server/                    # Backend (Terminal 1)
│   ├── index.js              # Main server file
│   ├── package.json          # Backend dependencies
│   ├── .env                  # Backend config (create this)
│   └── .env.example          # Example config
│
├── client/                    # Frontend (Terminal 2)
│   ├── pages/                # Next.js pages
│   │   ├── index.tsx         # Home page
│   │   └── room/[roomId].tsx # Room page
│   ├── components/           # React components
│   │   └── YouTubePlayer.tsx # YouTube player
│   ├── lib/                  # Utilities
│   │   ├── socket.ts         # Socket.io client
│   │   └── youtube.ts        # YouTube helpers
│   ├── package.json          # Frontend dependencies
│   ├── .env.local            # Frontend config (create this)
│   └── .env.local.example    # Example config
│
└── README.md                  # Documentation
```

---

## 🔧 Detailed Setup

### Backend Setup (Detailed)

#### 1. Install Dependencies

```bash
cd server
npm install
```

**Installed packages:**
- `express` - Web server
- `socket.io` - WebSocket library
- `cors` - CORS middleware

#### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=4000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Environment Variables Explained:**
- `PORT`: Server port (default: 4000)
- `CLIENT_URL`: Frontend URL for CORS (must match frontend)
- `NODE_ENV`: Environment (development/production)

#### 3. Start Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

#### 4. Verify Backend

Open [http://localhost:4000/health](http://localhost:4000/health)

Expected response:
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "2025-01-16T12:00:00.000Z"
}
```

### Frontend Setup (Detailed)

#### 1. Install Dependencies

```bash
cd client
npm install
```

**Installed packages:**
- `next` - React framework
- `react` & `react-dom` - React library
- `socket.io-client` - WebSocket client
- `tailwindcss` - CSS framework
- `typescript` - Type safety

#### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

**Important:**
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- Must match your backend URL
- No trailing slash

#### 3. Start Development Server

```bash
npm run dev
```

Server starts on [http://localhost:3000](http://localhost:3000)

#### 4. Build for Production (Optional)

```bash
npm run build
npm start
```

---

## 🧪 Testing the Application

### Basic Functionality Test

1. **Homepage Test:**
   - Navigate to `http://localhost:3000`
   - Verify both "Create Room" and "Join Room" sections appear
   - Check console for errors (F12)

2. **Create Room Test:**
   - Click "Create Room"
   - Verify redirect to `/room/[roomId]`
   - Check video player loads
   - Check connection indicator is green
   - Check user count shows "1 person"
   - Check "HOST" badge appears

3. **Join Room Test:**
   - Copy room URL from address bar
   - Open in incognito/another browser
   - Paste URL
   - Verify you join the same room
   - Check user count shows "2 people"
   - Check "HOST" badge does NOT appear

4. **Sync Test:**
   - In host window: Click play
   - In viewer window: Verify video plays
   - In host window: Click pause
   - In viewer window: Verify video pauses
   - In host window: Seek to different time
   - In viewer window: Verify video seeks

5. **Video Change Test:**
   - In host window: Paste new YouTube URL
   - Click "Change"
   - In viewer window: Verify video changes

### Advanced Testing

#### Test Drift Correction

1. Host plays video for 10 seconds
2. Viewer manually seeks to different time
3. Wait 2 seconds
4. Viewer should auto-correct to host's time

**Check console:** Should see "Drift detected: X.XXs - Correcting..."

#### Test Disconnection

1. Stop backend server (`Ctrl+C`)
2. Check connection indicator turns red
3. Restart backend server
4. Should automatically reconnect (green)

#### Test Multiple Users

1. Open 3-4 browser windows
2. All join same room
3. Verify user count updates
4. Host controls should sync to all

---

## 🐛 Troubleshooting

### Issue: npm install fails

**Error:** `EACCES` or permission errors

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/.config
```

**Error:** `Cannot find module`

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: Port already in use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=4001
```

For frontend (port 3000):
```bash
lsof -i :3000
kill -9 <PID>
```

### Issue: CORS errors

**Error:** `Access-Control-Allow-Origin`

**Solution:**
1. Check `CLIENT_URL` in backend `.env` matches frontend URL exactly
2. Restart backend after changing `.env`
3. Verify no typos (http vs https, trailing slash, etc.)

```bash
# Backend .env
CLIENT_URL=http://localhost:3000  # Correct
CLIENT_URL=http://localhost:3000/ # Wrong (trailing slash)
CLIENT_URL=localhost:3000         # Wrong (missing protocol)
```

### Issue: WebSocket connection failed

**Error:** `WebSocket connection failed` in console

**Solution:**
1. Verify backend is running
2. Check `NEXT_PUBLIC_SOCKET_URL` in frontend `.env.local`
3. Test health endpoint: `http://localhost:4000/health`
4. Check firewall/antivirus isn't blocking

### Issue: YouTube player not loading

**Error:** Player shows black screen

**Solution:**
1. Check browser console for errors
2. Verify YouTube IFrame API loaded (check Network tab)
3. Try different video ID
4. Check internet connection
5. Disable browser extensions (AdBlock can interfere)

### Issue: Videos not syncing

**Symptoms:** Play/pause doesn't sync between windows

**Debug steps:**
1. Open browser console in both windows
2. Play video in host window
3. Check console for `Emitting play event`
4. Check viewer console for receiving play event
5. Verify both connected (green indicator)

**Common causes:**
- Backend not running
- Wrong `NEXT_PUBLIC_SOCKET_URL`
- Firewall blocking WebSocket
- Browser cache (try hard refresh: Ctrl+Shift+R)

### Issue: Build errors

**Error:** TypeScript errors during build

**Solution:**
```bash
# Update TypeScript and dependencies
npm update

# If still fails, delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🔄 Common Development Tasks

### Restart Everything

```bash
# Stop both servers (Ctrl+C in each terminal)

# Backend
cd server
npm run dev

# Frontend (new terminal)
cd client
npm run dev
```

### Clear Cache and Restart

```bash
# Backend
cd server
rm -rf node_modules package-lock.json
npm install
npm run dev

# Frontend
cd client
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### Update Dependencies

```bash
# Backend
cd server
npm update
npm audit fix

# Frontend
cd client
npm update
npm audit fix
```

### View Logs

Backend logs appear in terminal automatically.

Frontend logs:
- Server logs: Terminal
- Client logs: Browser console (F12)

---

## 💡 Development Tips

### Hot Reload

Both backend and frontend support hot reload:
- **Backend:** Uses `nodemon` - saves trigger reload
- **Frontend:** Next.js Fast Refresh - instant updates

### Browser DevTools

Press `F12` for developer tools:
- **Console:** See logs and errors
- **Network:** Check WebSocket connection
- **Application:** View local storage

### Useful Console Commands

In browser console:
```javascript
// Check socket connection
socket.connected

// Get current room
window.location.pathname

// Force reconnect
socket.disconnect()
socket.connect()
```

### Code Formatting

Recommended VS Code extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### Multiple Test Windows

For testing sync:
1. Normal window (host)
2. Incognito window (viewer 1)
3. Different browser (viewer 2)
4. Mobile browser (viewer 3)

---

## 📚 Next Steps

Now that setup is complete:

1. ✅ **Read [README.md](README.md)** - Understand architecture
2. ✅ **Read [DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to production
3. ✅ **Explore the code** - Understand how it works
4. ✅ **Customize** - Add your own features!

---

## 🎓 Learning Resources

### Key Technologies

- [Next.js Docs](https://nextjs.org/docs)
- [Socket.io Docs](https://socket.io/docs)
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Code Files to Study

1. **Backend:** `server/index.js` - WebSocket logic
2. **Frontend:** `client/pages/room/[roomId].tsx` - Sync logic
3. **Player:** `client/components/YouTubePlayer.tsx` - YouTube integration

---

## ❓ Need Help?

1. Check this guide
2. Check browser console
3. Check terminal logs
4. Review the troubleshooting section
5. Check README.md

---

**✨ Happy coding! You're all set to develop and customize YouTube Sync!**
