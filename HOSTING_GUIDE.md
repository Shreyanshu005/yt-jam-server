# 🚀 How to Host YouTube Sync (Free)

Complete step-by-step guide to deploy your app to production for **$0**.

---

## 🎯 What You'll Get

After following this guide:
- ✅ Live backend URL (e.g., `https://youtube-sync-xxxx.onrender.com`)
- ✅ Live frontend URL (e.g., `https://youtube-sync.vercel.app`)
- ✅ Fully functional app accessible worldwide
- ✅ All for FREE!

---

# Part 1: Push to GitHub (5 minutes)

## Step 1: Create GitHub Account
1. Go to [github.com](https://github.com)
2. Sign up if you don't have an account (it's free!)

## Step 2: Create New Repository
1. Click the **"+"** icon (top right) → "New repository"
2. Repository name: `youtube-sync`
3. Description: "Real-time synchronized YouTube playback app"
4. Make it **Public**
5. **DO NOT** check "Add README" (we already have files)
6. Click **"Create repository"**

## Step 3: Push Your Code

Open terminal in your project folder and run:

```bash
# Navigate to your project
cd /Users/shreyanshu/Desktop/youtube-jam

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - YouTube Sync app"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/youtube-sync.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**✅ Checkpoint:** Visit `https://github.com/YOUR_USERNAME/youtube-sync` - you should see your code!

---

# Part 2: Deploy Backend to Render (10 minutes)

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest option)
4. Authorize Render to access your repositories

## Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"** → Next
3. Find your `youtube-sync` repository → **Connect**

## Step 3: Configure Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `youtube-sync-backend` (or any name) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

## Step 4: Add Environment Variable

1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add:
   - **Key:** `CLIENT_URL`
   - **Value:** Leave empty for now (we'll update after frontend is deployed)
4. Click **"Create Web Service"**

## Step 5: Wait for Deployment (3-5 minutes)

Watch the logs - you'll see:
```
Building...
Installing dependencies...
Deployed successfully!
```

## Step 6: Copy Backend URL

Once deployed:
1. Look at the top of the page
2. Copy your backend URL: `https://youtube-sync-backend-xxxx.onrender.com`
3. **Save this URL** - you'll need it for the frontend!

**✅ Test Backend:**
Visit: `https://your-backend-url.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "..."
}
```

---

# Part 3: Deploy Frontend to Vercel (5 minutes)

## Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended)
4. Authorize Vercel

## Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find your `youtube-sync` repository
3. Click **"Import"**

## Step 3: Configure Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `client` ← Click "Edit" and select this! |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |

## Step 4: Add Environment Variable

1. Expand **"Environment Variables"**
2. Add variable:
   - **Key:** `NEXT_PUBLIC_SOCKET_URL`
   - **Value:** Your backend URL from Part 2 (e.g., `https://youtube-sync-backend-xxxx.onrender.com`)
3. **Important:** Use `https://` NOT `http://`!

## Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes while Vercel builds your app
3. Watch the deployment logs

Once done, you'll see:
```
🎉 Congratulations! Your deployment is ready.
```

## Step 6: Copy Frontend URL

1. Copy your frontend URL: `https://youtube-sync-xxxx.vercel.app`
2. **Visit it** - your app is live!

---

# Part 4: Update Backend CORS (Important!)

Now that frontend is deployed, update the backend:

## Step 1: Go Back to Render
1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click on your **youtube-sync-backend** service

## Step 2: Update Environment Variable
1. Go to **"Environment"** tab
2. Find `CLIENT_URL`
3. Click **"Edit"**
4. Set value to your Vercel URL: `https://youtube-sync-xxxx.vercel.app`
5. **Important:** No trailing slash!
6. Click **"Save Changes"**

## Step 3: Redeploy Backend
1. Service will automatically redeploy (wait 1-2 minutes)
2. Watch logs until you see "Deployed successfully"

---

# 🎉 You're Live!

## Test Your Deployed App

1. **Visit your frontend:** `https://youtube-sync-xxxx.vercel.app`
2. **Click "Create Room"**
3. **Copy the room link**
4. **Open in incognito/another device**
5. **Paste link and join**
6. **Test sync** - play/pause should sync!

---

# 📊 What You Just Deployed

```
                    USERS
                      ↓
          ┌──────────────────────┐
          │   Vercel (Frontend)  │
          │  youtube-sync.vercel │
          │      Next.js App     │
          └──────────┬───────────┘
                     │
                     │ WebSocket
                     │
          ┌──────────▼───────────┐
          │  Render (Backend)    │
          │ youtube-sync.onrender│
          │   Node.js + Socket   │
          └──────────────────────┘
```

---

# 🔧 Common Issues

### Issue: "Can't connect to backend"

**Check:**
1. Backend URL in Vercel uses `https://` (not `http://`)
2. CLIENT_URL in Render matches Vercel URL exactly
3. No trailing slashes in URLs
4. Both services show "Deployed successfully"

### Issue: "CORS error"

**Solution:**
1. Go to Render → Environment
2. Check `CLIENT_URL` = `https://your-frontend.vercel.app`
3. Must match exactly (no trailing /)
4. Save and wait for redeploy

### Issue: "Backend sleeping"

**Note:** Free Render apps sleep after 15 min of inactivity
- First request takes 30-60 seconds (cold start)
- Subsequent requests are fast
- This is normal on free tier!

---

# 🎯 Pro Tips

### Custom Domain (Optional)

**Frontend (Vercel):**
1. Go to project settings → Domains
2. Add your custom domain
3. Update DNS as instructed

**Backend (Render):**
1. Service settings → Custom Domains
2. Add your domain
3. Update DNS

### Monitor Your App

**Render Dashboard:**
- View logs
- Monitor uptime
- Check performance

**Vercel Dashboard:**
- View deployment logs
- Monitor traffic
- See error reports

### Update Your App

**To deploy updates:**

```bash
# Make changes to your code
# Then commit and push

git add .
git commit -m "Update: description of changes"
git push

# Both Vercel and Render will auto-deploy!
```

---

# 📈 Free Tier Limits

### Render Free Tier
- ✅ 750 hours/month (plenty for 1 app)
- ✅ Sleeps after 15 min inactivity
- ✅ 512 MB RAM
- ✅ Shared CPU

### Vercel Free Tier
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic SSL
- ✅ Edge network (fast globally)

**Both are perfect for personal projects!**

---

# 🆙 Upgrade Later (Optional)

When you're ready to scale:

**Render:** $7/month
- No sleeping
- Better performance
- More RAM

**Vercel:** $20/month
- More bandwidth
- Team features
- Analytics

---

# ✅ Final Checklist

Before sharing your app:

- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] CLIENT_URL updated on Render
- [ ] Tested creating a room
- [ ] Tested joining a room
- [ ] Tested sync between 2+ windows
- [ ] Connection indicator is green
- [ ] No CORS errors in console

---

# 🎊 Congratulations!

Your YouTube Sync app is now live and accessible worldwide!

**Share your link:** `https://youtube-sync-xxxx.vercel.app`

**Enjoy synchronized watch parties with friends!** 🎬

---

## 📞 Need Help?

**Check logs:**
- Render: Dashboard → Logs tab
- Vercel: Deployment → View Function Logs

**Read full deployment guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

**Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Built with ❤️ • Now live on the internet! 🌍**
