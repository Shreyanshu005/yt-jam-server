# ⚡ Quick Start Guide

Get YouTube Sync running in **under 5 minutes**.

## Prerequisites

- Node.js 18+ installed
- Two terminal windows

---

## 🚀 Start in 3 Commands

### Terminal 1 - Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

✅ Server running on http://localhost:4000

### Terminal 2 - Frontend

```bash
cd client
npm install
cp .env.local.example .env.local
npm run dev
```

✅ App running on http://localhost:3000

---

## 🎯 Test It

1. **Open:** http://localhost:3000
2. **Click:** "Create Room"
3. **Copy:** Room URL from address bar
4. **Open:** URL in incognito window
5. **Test:** Play/pause in one window, watch it sync!

---

## 🐛 Issues?

**Port in use:**
```bash
# Kill process on port 4000
lsof -i :4000
kill -9 <PID>
```

**Dependencies fail:**
```bash
# Use Node 18+
node --version
```

**Sync not working:**
- Check both terminals running
- Green connection indicator?
- Try hard refresh (Ctrl+Shift+R)

---

## 📚 Full Documentation

- **Setup:** See [SETUP.md](SETUP.md)
- **Deploy:** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Details:** See [README.md](README.md)

---

## 🎉 That's it!

You now have a fully functional synchronized YouTube watch party app!

**Share rooms with friends and watch together!**
