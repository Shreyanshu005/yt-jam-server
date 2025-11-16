# 🔧 Troubleshooting Guide

Common issues and their solutions.

## 🚨 Quick Diagnostics

### Check Server Status

```bash
# Backend health
curl http://localhost:4000/health

# Expected response:
{"status":"ok","rooms":0,"timestamp":"..."}
```

### Check Connection in Browser

Open browser console (F12) and check for:
- ✅ Green connection indicator
- ✅ "Connected to server" message
- ❌ Red errors about CORS or WebSocket

---

## 🔴 Installation Issues

### Problem: `npm install` fails

**Error Messages:**
- `EACCES: permission denied`
- `gyp ERR! stack Error: EACCES`

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/.config

# Then retry
npm install
```

### Problem: Node version too old

**Error:** `Requires Node.js 18+`

**Solution:**
```bash
# Check current version
node --version

# Update Node.js:
# Option 1: Download from https://nodejs.org
# Option 2: Use nvm
nvm install 18
nvm use 18
```

### Problem: `Cannot find module`

**Error:** `Error: Cannot find module 'express'`

**Solution:**
```bash
# Make sure you're in the right directory
cd server  # or cd client

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🔴 Server Startup Issues

### Problem: Port already in use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use different port
# Edit server/.env:
PORT=4001
```

### Problem: Environment variables not loading

**Error:** Server starts but CORS fails

**Solution:**
```bash
# Check .env file exists
cd server
ls -la .env

# If missing, create it:
cp .env.example .env

# Edit .env with your values
nano .env
```

### Problem: Server crashes immediately

**Check logs for specific error:**

**Common causes:**
1. **Missing dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Syntax error in code:**
   - Check server/index.js for typos
   - Revert to original if modified

3. **Node version mismatch:**
   ```bash
   node --version  # Should be 18+
   ```

---

## 🔴 Frontend Issues

### Problem: Frontend won't start

**Error:** `Error: Cannot find module 'next'`

**Solution:**
```bash
cd client
rm -rf node_modules .next package-lock.json
npm install
npm run dev
```

### Problem: Page not found (404)

**Error:** `404 - This page could not be found`

**Solution:**
1. Make sure dev server is running
2. Check URL is correct:
   - Home: `http://localhost:3000`
   - Room: `http://localhost:3000/room/abc123`
3. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Problem: Styles not loading

**Symptoms:** Page appears unstyled, no colors

**Solution:**
```bash
cd client

# Check Tailwind config exists
ls -la tailwind.config.js

# Rebuild
rm -rf .next
npm run dev
```

---

## 🔴 Connection Issues

### Problem: WebSocket connection failed

**Error in console:** `WebSocket connection to 'ws://localhost:4000' failed`

**Solution:**

**1. Check backend is running:**
```bash
# Should return server info
curl http://localhost:4000/health
```

**2. Check NEXT_PUBLIC_SOCKET_URL:**
```bash
# client/.env.local
cat client/.env.local

# Should be:
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

**3. Restart both servers:**
```bash
# Stop both (Ctrl+C)
# Start backend first
cd server && npm run dev

# Then frontend (new terminal)
cd client && npm run dev
```

### Problem: CORS errors

**Error in console:**
```
Access to XMLHttpRequest at 'http://localhost:4000' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

**1. Check CLIENT_URL in backend .env:**
```bash
# server/.env
CLIENT_URL=http://localhost:3000  # Must match frontend exactly
```

**2. Common mistakes:**
```bash
# ❌ Wrong
CLIENT_URL=http://localhost:3000/
CLIENT_URL=localhost:3000
CLIENT_URL=https://localhost:3000

# ✅ Correct
CLIENT_URL=http://localhost:3000
```

**3. Restart backend after changing .env:**
```bash
cd server
npm run dev
```

### Problem: Connection indicator stays red

**Symptoms:** Red dot in header, "Disconnected" message

**Checklist:**
- [ ] Backend running? (`curl http://localhost:4000/health`)
- [ ] Frontend running? (Page loads?)
- [ ] Correct SOCKET_URL in .env.local?
- [ ] Console errors? (Check F12)
- [ ] Firewall blocking? (Try disabling temporarily)

**Debug in console:**
```javascript
// Check socket status
console.log(socket.connected);

// Try manual connection
const io = require('socket.io-client');
const socket = io('http://localhost:4000');
socket.on('connect', () => console.log('Connected!'));
```

---

## 🔴 Sync Issues

### Problem: Videos not syncing

**Symptoms:** Play/pause doesn't sync between windows

**Debug steps:**

**1. Check both windows are connected:**
- Green connection indicator in both?
- User count shows 2+?

**2. Open console in BOTH windows:**
```javascript
// In host window, play video
// Should see: "Emitting play event"

// In viewer window
// Should see: Receiving play event
```

**3. Common causes:**

| Issue | Solution |
|-------|----------|
| Not in same room | Verify same URL in both windows |
| Backend not broadcasting | Check server terminal for errors |
| Player not initialized | Wait for player to fully load |
| Browser cache | Hard refresh both windows |

### Problem: Drift correction too aggressive

**Symptoms:** Player keeps jumping around

**Solution:**

Edit `client/pages/room/[roomId].tsx`:

```typescript
// Increase threshold (line ~20)
const DRIFT_THRESHOLD = 1.0; // Was 0.3

// Increase interval (line ~21)
const SYNC_INTERVAL = 5000; // Was 2000
```

### Problem: Drift correction not working

**Symptoms:** Playback drifts over time

**Debug:**
```typescript
// Add logging in client/pages/room/[roomId].tsx
socket.on('time-update', (data) => {
  console.log('Host time:', data.time);
  console.log('My time:', playerRef.current.getCurrentTime());
  console.log('Drift:', Math.abs(data.time - playerRef.current.getCurrentTime()));
});
```

**Expected:** Drift should be < 0.3 seconds

---

## 🔴 YouTube Player Issues

### Problem: Black screen / player not loading

**Symptoms:** Video player area is black

**Solutions:**

**1. Check YouTube API loaded:**
```javascript
// In browser console
console.log(window.YT);
// Should show YouTube API object
```

**2. Check video ID is valid:**
```javascript
// Test with known working video
// Rick Astley - Never Gonna Give You Up
videoId = 'dQw4w9WgXcQ'
```

**3. Check browser console for errors:**
- API not loaded?
- Invalid video ID?
- Network error?

**4. Try different browser:**
- Chrome (recommended)
- Firefox
- Safari

### Problem: "Video unavailable" error

**Error messages:**
- "Video not found"
- "Playback on other websites has been disabled"
- "This video is private"

**Solution:**
1. Video might not allow embedding
2. Video might be region-restricted
3. Video might be private/deleted
4. Try different video

**Test with these known-working IDs:**
- `dQw4w9WgXcQ` (Rick Roll)
- `jNQXAC9IVRw` (Me at the zoo)
- `kJQP7kiw5Fk` (Despacito)

### Problem: Player controls not working

**Symptoms:** Can't play/pause/seek

**Solutions:**

**1. Check if you're the host:**
- Only host controls sync to others
- Viewers follow host

**2. Check player initialized:**
```javascript
// In console
console.log(playerRef.current);
// Should show player object, not null
```

**3. Check for JavaScript errors:**
- Open console (F12)
- Look for red errors
- Player might have failed to initialize

---

## 🔴 Room Issues

### Problem: Can't create room

**Symptoms:** Create room button doesn't work

**Debug:**
1. Check console for errors
2. Check network tab (F12) - any failed requests?
3. Try different browser
4. Clear browser cache

**Solution:**
```bash
# Hard refresh
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# Or clear site data
# Chrome: F12 → Application → Clear storage
```

### Problem: Can't join room

**Symptoms:** Room URL doesn't work

**Checklist:**
- [ ] URL format correct? `/room/abc123`
- [ ] Backend running?
- [ ] Room still exists? (Empty rooms are deleted)
- [ ] Copy-paste error? (Try creating new room)

### Problem: User count wrong

**Symptoms:** Shows "1 person" but multiple users connected

**Solution:**
1. Each user should have green connection indicator
2. Check backend logs for "joining room" messages
3. Try refreshing all windows
4. Check different browsers aren't counted as same user

---

## 🔴 Deployment Issues

### Problem: Vercel build fails

**Error:** `Build failed`

**Solution:**

**1. Check build locally:**
```bash
cd client
npm run build
```

**2. Fix any TypeScript errors:**
- Check console output
- Fix type errors in code

**3. Check environment variables:**
- Added `NEXT_PUBLIC_SOCKET_URL` in Vercel?
- Matches your backend URL?

**4. Check logs in Vercel dashboard:**
- Deployment → View Function Logs
- Look for specific error

### Problem: Render deployment fails

**Error:** `Deploy failed`

**Solution:**

**1. Check build command:**
- Should be: `npm install`

**2. Check start command:**
- Should be: `npm start`

**3. Check Node version:**
- Should be 18+
- Set in render.yaml or dashboard

**4. Check environment variables:**
- `CLIENT_URL` matches frontend

### Problem: Production app not connecting

**Symptoms:** Works locally, fails in production

**Checklist:**

**Backend (Render):**
- [ ] Deployment successful?
- [ ] Health endpoint works? `https://your-app.onrender.com/health`
- [ ] CLIENT_URL set correctly?
- [ ] No trailing slash in CLIENT_URL?

**Frontend (Vercel):**
- [ ] Deployment successful?
- [ ] NEXT_PUBLIC_SOCKET_URL set?
- [ ] Points to backend URL?
- [ ] Uses `https://` (not `http://`)?

**Common mistake:**
```bash
# ❌ Wrong
NEXT_PUBLIC_SOCKET_URL=http://your-backend.onrender.com

# ✅ Correct
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
```

---

## 🔴 Performance Issues

### Problem: Slow/laggy sync

**Symptoms:** Delay between host and viewer actions

**Solutions:**

**1. Check network speed:**
```bash
# Test latency
ping google.com
```

**2. Reduce sync interval:**
```typescript
// client/pages/room/[roomId].tsx
const SYNC_INTERVAL = 1000; // Faster sync (more bandwidth)
```

**3. Check server location:**
- Free tiers may have cold starts
- Choose server region close to users

### Problem: High CPU usage

**Symptoms:** Browser/computer running hot

**Solutions:**
1. Close unused browser tabs
2. Update browser to latest version
3. Check browser extensions (disable ad blockers temporarily)
4. Try incognito mode

---

## 🔴 Browser-Specific Issues

### Chrome

**Issue:** Sometimes doesn't autoplay
**Solution:** User interaction required first (click play manually once)

### Firefox

**Issue:** WebSocket connection slower
**Solution:** Normal, Firefox more strict with WebSockets

### Safari

**Issue:** Autoplay might not work
**Solution:** Check Safari autoplay settings

### Mobile Browsers

**Issue:** Player too small
**Solution:** App is responsive, pinch to zoom if needed

---

## 🛠️ Advanced Debugging

### Enable Verbose Logging

**Backend:**
```javascript
// server/index.js
// Add after io.on('connection')
socket.onAny((event, ...args) => {
  console.log(`[${socket.id}] ${event}:`, args);
});
```

**Frontend:**
```typescript
// client/lib/socket.ts
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### Monitor Network Traffic

**Chrome DevTools:**
1. Open DevTools (F12)
2. Network tab
3. Filter: WS (WebSocket)
4. Watch messages in real-time

### Check Room State

**Backend:**
```javascript
// Add to server/index.js
app.get('/api/debug/rooms', (req, res) => {
  const roomData = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    users: room.users.size,
    video: room.videoId,
    host: room.host
  }));
  res.json(roomData);
});
```

Visit: `http://localhost:4000/api/debug/rooms`

---

## 📞 Still Having Issues?

### Checklist Before Asking for Help

- [ ] Read this troubleshooting guide
- [ ] Checked browser console (F12)
- [ ] Checked server terminal logs
- [ ] Tried in different browser
- [ ] Cleared cache and hard refreshed
- [ ] Restarted both servers
- [ ] Verified environment variables
- [ ] Tested health endpoint

### Information to Provide

When asking for help, include:

1. **What you're trying to do**
2. **What's happening instead**
3. **Error messages** (exact text)
4. **Browser and version**
5. **Node.js version** (`node --version`)
6. **Operating system**
7. **Steps to reproduce**
8. **Console logs** (screenshot)
9. **Environment** (local/production)

---

## 🔄 Nuclear Option (Complete Reset)

If all else fails, start fresh:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Delete everything
cd youtube-jam
rm -rf server/node_modules client/node_modules
rm -rf server/package-lock.json client/package-lock.json
rm -rf client/.next

# 3. Reinstall backend
cd server
npm install
cp .env.example .env
# Edit .env with correct values

# 4. Reinstall frontend
cd ../client
npm install
cp .env.local.example .env.local
# Edit .env.local with correct values

# 5. Start fresh
cd ../server && npm run dev

# New terminal
cd client && npm run dev
```

---

**💡 Pro Tip:** Most issues are caused by:
1. Backend not running
2. Wrong environment variables
3. Port conflicts
4. Browser cache

**Try these first before diving deep!**

---

**🎯 99% of issues can be solved by:**
- ✅ Restarting servers
- ✅ Hard refreshing browser
- ✅ Checking environment variables
- ✅ Reading error messages carefully

**Good luck! 🍀**
