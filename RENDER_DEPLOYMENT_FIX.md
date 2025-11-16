# 🔧 Render Deployment Fix

## Issue: WebSocket Connection Failed

Error: `WebSocket connection to 'wss://yt-jam-server.onrender.com/socket.io/?EIO=4&transport=websocket' failed`

---

## ✅ Solution Steps

### Step 1: Verify Backend is Running

Visit your backend health endpoint:
```
https://yt-jam-server.onrender.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "..."
}
```

**If you get an error:**
- Backend is not deployed or sleeping
- Check Render dashboard logs

---

### Step 2: Check Render Backend Settings

Go to [Render Dashboard](https://dashboard.render.com) → Your Service

**Verify these settings:**

| Setting | Correct Value |
|---------|--------------|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Environment | Node |

**Environment Variables:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://yt-jam-server-30hh2nzbl-shreyanshus-projects.vercel.app` |

⚠️ **Important:** `CLIENT_URL` must match your Vercel URL EXACTLY (no trailing slash!)

---

### Step 3: Update Server CORS for Production

Your backend needs to accept WebSocket connections. Check if `server/index.js` has proper CORS:

```javascript
// Should have:
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

### Step 4: Redeploy Backend

After updating environment variables:

1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment (watch logs)
4. Check health endpoint again

---

### Step 5: Update Frontend Environment Variable

In Vercel, make sure:

**Environment Variable:**
- Key: `NEXT_PUBLIC_SOCKET_URL`
- Value: `https://yt-jam-server.onrender.com` (with HTTPS!)

Then redeploy frontend:
- Vercel auto-redeploys on environment variable changes
- Or go to Deployments → Redeploy

---

## 🔍 Troubleshooting

### Issue: "This site can't be reached"

**Backend is sleeping (Render free tier):**
- First request takes 30-60 seconds
- Visit health endpoint and wait
- Then try connecting again

### Issue: Still getting WebSocket errors

**Check logs:**

1. **Backend logs (Render):**
   - Dashboard → Logs tab
   - Look for errors during startup

2. **Frontend logs (Vercel):**
   - Deployments → Function Logs
   - Check for connection attempts

### Issue: CORS errors

**Update CLIENT_URL:**
```bash
# In Render Environment Variables
CLIENT_URL=https://your-exact-vercel-url.vercel.app
```

No wildcards, no trailing slash, must be HTTPS!

---

## ✅ Quick Checklist

- [ ] Backend deployed on Render
- [ ] Health endpoint returns 200 OK
- [ ] `CLIENT_URL` env var matches Vercel URL exactly
- [ ] Vercel `NEXT_PUBLIC_SOCKET_URL` uses `https://` (not `http://`)
- [ ] Both services show "Deployed successfully"
- [ ] Tested health endpoint: works
- [ ] Frontend loads without errors

---

## 🚀 Alternative: Use EC2 with SSL

If Render doesn't work, set up SSL on EC2:

### Option A: Use ngrok (Quick Test)

```bash
# On EC2
cd /path/to/youtube-jam/server
npm start

# In another terminal
./ngrok http 4000
```

You'll get: `https://xxxx.ngrok.io`

Update Vercel env var to use this URL.

### Option B: Proper SSL with Let's Encrypt

```bash
# Install certbot
sudo apt update
sudo apt install certbot nginx -y

# Get certificate (need domain name)
sudo certbot certonly --nginx -d yourdomain.com

# Update your server to use SSL
# (requires Node.js HTTPS setup)
```

---

## 📞 Still Not Working?

**Check these URLs:**

1. **Backend health:** `https://yt-jam-server.onrender.com/health`
2. **Frontend:** `https://yt-jam-server-30hh2nzbl-shreyanshus-projects.vercel.app`

**If backend URL is different:**
- Update `NEXT_PUBLIC_SOCKET_URL` in Vercel
- Make sure it matches exactly

**Common mistakes:**
- ❌ `http://` instead of `https://`
- ❌ Trailing slash: `https://url.com/`
- ❌ Wrong URL entirely
- ❌ CLIENT_URL doesn't match frontend

---

## ✅ Correct Configuration

**Render (Backend):**
```
SERVICE_URL: https://yt-jam-server.onrender.com
CLIENT_URL: https://your-frontend.vercel.app
```

**Vercel (Frontend):**
```
NEXT_PUBLIC_SOCKET_URL: https://yt-jam-server.onrender.com
```

**Both must use HTTPS!**

---

**Once fixed, your app will be live! 🎉**
