# 🚀 Deployment Guide

Complete guide to deploy YouTube Sync to production.

## Overview

- **Frontend:** Deploy to Vercel (recommended) or Netlify
- **Backend:** Deploy to Render.com or Railway.app
- **Total Cost:** $0 (using free tiers)

## 📋 Prerequisites

- GitHub account
- Vercel account (for frontend)
- Render.com or Railway.app account (for backend)

---

## 🔧 Backend Deployment

### Option A: Render.com (Recommended)

#### Step 1: Prepare Your Code

1. Push your code to GitHub:
```bash
cd youtube-jam
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### Step 2: Deploy on Render

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name:** `youtube-sync-server`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

6. Add Environment Variable:
   - **Key:** `CLIENT_URL`
   - **Value:** (Leave empty for now, update after frontend deployment)

7. Click "Create Web Service"

8. Wait for deployment (2-3 minutes)

9. Copy your backend URL: `https://youtube-sync-server-xxxx.onrender.com`

#### Step 3: Update Environment Variable

After frontend is deployed:
1. Go to your service settings
2. Update `CLIENT_URL` to your Vercel URL
3. Save changes (service will redeploy)

### Option B: Railway.app

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add environment variable:
   - `CLIENT_URL`: Your frontend URL (add after frontend deployment)
7. Deploy

Your backend URL: `https://your-service.up.railway.app`

---

## 🎨 Frontend Deployment

### Option A: Vercel (Recommended)

#### Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `client`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

6. Add Environment Variable:
   - **Key:** `NEXT_PUBLIC_SOCKET_URL`
   - **Value:** Your backend URL from Render/Railway
   - Example: `https://youtube-sync-server-xxxx.onrender.com`

7. Click "Deploy"

8. Wait for deployment (2-3 minutes)

9. Your app is live! 🎉

#### Step 2: Update Backend CORS

1. Go back to Render/Railway
2. Update `CLIENT_URL` environment variable
3. Set to your Vercel URL: `https://your-app.vercel.app`
4. Service will redeploy automatically

#### Step 3: Test Your App

1. Visit your Vercel URL
2. Create a room
3. Open the room link in incognito/another browser
4. Test play/pause/seek synchronization
5. Verify drift correction is working

### Option B: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub and select repository
4. Configure:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Add environment variable:
   - `NEXT_PUBLIC_SOCKET_URL`: Your backend URL
6. Deploy
7. Update backend `CLIENT_URL` with your Netlify URL

---

## 🔄 Custom Domain (Optional)

### For Vercel

1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration steps
5. Update backend `CLIENT_URL` to your custom domain

### For Render

1. Go to your service settings
2. Navigate to "Custom Domains"
3. Add your domain
4. Configure DNS records as shown

---

## ✅ Post-Deployment Checklist

- [ ] Backend is deployed and running
- [ ] Frontend is deployed and accessible
- [ ] Environment variables are set correctly
- [ ] Backend `CLIENT_URL` points to frontend
- [ ] Frontend `NEXT_PUBLIC_SOCKET_URL` points to backend
- [ ] CORS is working (no console errors)
- [ ] Room creation works
- [ ] Room joining works
- [ ] Video playback syncs correctly
- [ ] Drift correction is functioning
- [ ] Multiple users can join same room

---

## 🐛 Deployment Troubleshooting

### Issue: CORS Errors

**Symptoms:**
- Console error: "CORS policy blocked"
- Can't connect to backend

**Solution:**
1. Check `CLIENT_URL` in backend matches your frontend URL exactly
2. Include protocol: `https://` not `http://`
3. No trailing slash: `https://app.com` not `https://app.com/`
4. Redeploy backend after changing environment variables

### Issue: WebSocket Connection Failed

**Symptoms:**
- Red connection indicator
- "Connection failed" in console

**Solution:**
1. Verify `NEXT_PUBLIC_SOCKET_URL` is correct
2. Check backend is running (visit `/health` endpoint)
3. Ensure backend accepts WebSocket connections
4. Check firewall/network settings

### Issue: Build Failures

**Backend:**
```bash
# Check Node version
node --version  # Should be 18+

# Verify package.json is valid
cd server
npm install
npm start
```

**Frontend:**
```bash
# Check build locally
cd client
npm install
npm run build
npm start
```

### Issue: Environment Variables Not Working

**Vercel:**
- Go to project settings → Environment Variables
- Ensure `NEXT_PUBLIC_` prefix for client-side variables
- Redeploy after adding variables

**Render:**
- Check service → Environment
- Variables apply after redeploy
- No quotes needed around values

---

## 📊 Monitoring

### Backend Health

Check backend status:
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "2025-01-16T12:00:00.000Z"
}
```

### Frontend Health

Check frontend is accessible:
```bash
curl https://your-frontend-url.com
```

Should return HTML with status 200.

### WebSocket Health

Use browser console:
```javascript
// Should show connected
const socket = io('https://your-backend-url.com');
socket.on('connect', () => console.log('Connected!'));
```

---

## 🔒 Security Considerations

### Production Checklist

- [ ] CORS restricted to your frontend domain only
- [ ] Environment variables not committed to Git
- [ ] HTTPS enabled on both frontend and backend
- [ ] Rate limiting implemented (optional for MVP)
- [ ] Error messages don't expose sensitive info

### Recommended Backend Updates

Add to `server/index.js`:

```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## 📈 Scaling Considerations

### Free Tier Limits

**Render.com Free:**
- 750 hours/month
- Sleeps after 15 min inactivity
- Cold start: 30-60 seconds

**Vercel Free:**
- 100 GB bandwidth/month
- Unlimited deployments
- Edge network (fast globally)

### Upgrade Path

When you need more:

1. **Render:** Upgrade to $7/month for always-on
2. **Vercel:** Pro plan for more bandwidth
3. **Database:** Add Redis for room persistence
4. **CDN:** Already included with Vercel

---

## 🎯 Production Best Practices

### 1. Monitoring

Set up monitoring:
- Render: Built-in metrics
- Vercel: Analytics in dashboard
- Add error tracking (Sentry, etc.)

### 2. Logging

Backend logs:
```javascript
console.log(`[${new Date().toISOString()}] Event:`, data);
```

View logs:
- Render: Logs tab in dashboard
- Railway: Deployment logs

### 3. Backup Strategy

Although rooms are ephemeral:
- Keep Git history clean
- Tag production releases
- Document environment variables

### 4. Updates

Update dependencies:
```bash
# Backend
cd server
npm update

# Frontend
cd client
npm update
```

Test locally before deploying.

---

## 🚀 Quick Deploy Commands

### Complete Deployment from Scratch

```bash
# 1. Clone and setup
git clone <your-repo>
cd youtube-jam

# 2. Push to GitHub
git remote add origin <your-github-url>
git push -u origin main

# 3. Deploy backend on Render.com (via dashboard)

# 4. Deploy frontend on Vercel (via dashboard)

# 5. Update environment variables (via dashboards)

# 6. Test!
```

---

## 📞 Support

**Render Issues:**
- Check [Render Status](https://status.render.com)
- [Render Docs](https://render.com/docs)

**Vercel Issues:**
- Check [Vercel Status](https://www.vercel-status.com)
- [Vercel Docs](https://vercel.com/docs)

**App Issues:**
- Check browser console
- Check backend logs
- Review this deployment guide

---

**🎉 Congratulations! Your YouTube Sync app is now live!**

Share your deployment:
- Frontend: `https://your-app.vercel.app`
- Create rooms and watch together!
