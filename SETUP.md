# SoundCloud Sync - Setup Guide

A real-time synchronized music player for SoundCloud with search, queue management, and chat.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- SoundCloud API credentials

## 1. Get SoundCloud API Credentials

1. **Register your app** at [SoundCloud Developer Portal](https://soundcloud.com/you/apps)
2. Click **"Register a new app"**
3. Fill in the form:
   - **App name**: Your app name (e.g., "SoundCloud Sync")
   - **App description**: Brief description
   - **App website**: `http://localhost:3000` (for development)
   - **Redirect URI**: `http://localhost:3000/callback` ⚠️ **IMPORTANT**: This must be exact!
4. Click **"Register"**
5. You'll receive:
   - **Client ID**
   - **Client Secret**

⚠️ **Keep these credentials secure!** Never commit them to version control.

### Important: Redirect URI Configuration

The redirect URI must be registered in your SoundCloud app settings:
- **Development**: `http://localhost:3000/callback`
- **Production**: `https://yourdomain.com/callback`

Make sure the redirect URI in your SoundCloud app settings **exactly matches** the one in your `.env` file!

## 2. Server Setup

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your credentials
nano .env  # or use your preferred editor
```

**server/.env** should look like:
```env
PORT=4000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Add your SoundCloud credentials here
SOUNDCLOUD_CLIENT_ID=your_actual_client_id_here
SOUNDCLOUD_CLIENT_SECRET=your_actual_client_secret_here

# OAuth redirect URI (must match SoundCloud app settings)
REDIRECT_URI=http://localhost:3000/callback
```

## 3. Client Setup

```bash
cd ../client

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit if needed (defaults should work)
nano .env.local
```

**client/.env.local** should look like:
```env
# SoundCloud OAuth Client ID (same as server)
NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID=your_actual_client_id_here

# Server URL for API and WebSocket connections
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## 4. Run the Application

Open **two terminal windows**:

### Terminal 1 - Start the Server
```bash
cd server
npm run dev
```

You should see:
```
✅ SoundCloud token obtained
🚀 Server running on port 4000
📡 Socket.io ready for connections
🌍 Environment: development
```

### Terminal 2 - Start the Client
```bash
cd client
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## 5. Access the App

Open your browser and go to: **http://localhost:3000**

## Features

✅ **User Authentication** - Sign in with your SoundCloud account
✅ **Track Search** - Search SoundCloud's entire library
✅ **Queue Management** - Build and manage playlists
✅ **Real-time Sync** - All users hear the same thing at the same time
✅ **Chat** - Talk while you listen
✅ **Room Sharing** - Share rooms with friends via link
✅ **Player Controls** - Play, pause, skip tracks  

## Troubleshooting

### "401 Unauthorized" Error

This means your SoundCloud credentials are not configured correctly:

1. Check that your `.env` file in the `server` directory has the correct credentials
2. Make sure you copied the **Client ID** and **Client Secret** exactly (no extra spaces)
3. Restart the server after updating `.env`
4. Check server logs for specific error messages

### "SoundCloud credentials not configured"

1. Make sure your `server/.env` file exists
2. Check that `SOUNDCLOUD_CLIENT_ID` and `SOUNDCLOUD_CLIENT_SECRET` are set
3. Restart the server

### Search returns no results

1. Check browser console for errors
2. Check server logs for API errors
3. Verify your SoundCloud app is active in the [developer portal](https://soundcloud.com/you/apps)
4. Try searching for a common term like "music" or "remix"

### Cannot connect to room

1. Make sure both server and client are running
2. Check that `NEXT_PUBLIC_SOCKET_URL` in client `.env.local` matches your server URL
3. Check browser console for WebSocket errors

## Production Deployment

For production deployment:

1. Update `CLIENT_URL` in server `.env` to your production domain
2. Update `NEXT_PUBLIC_SOCKET_URL` in client `.env.local` to your production server
3. Use environment variables on your hosting platform for credentials
4. Enable HTTPS for secure WebSocket connections

## Support

- SoundCloud API Docs: https://developers.soundcloud.com/docs/api/guide
- Socket.io Docs: https://socket.io/docs/
- Next.js Docs: https://nextjs.org/docs

## Security Notes

- Never expose your `SOUNDCLOUD_CLIENT_SECRET` to the client
- All API requests go through the server proxy
- App-level tokens are cached server-side and automatically refreshed
- User authentication uses OAuth 2.1 with PKCE for security
- User tokens are stored client-side in localStorage
- The app falls back to app-level authentication if user is not logged in

## OAuth Authentication Flow

This app supports **two modes of authentication**:

1. **App-level** (default): Uses Client Credentials flow
   - Works without user login
   - Limited to public tracks
   - Tokens managed server-side

2. **User-level** (optional): Uses Authorization Code flow with PKCE
   - Click "Connect with SoundCloud" to sign in
   - Access to user's private tracks and playlists
   - More personalized search results
   - Tokens stored client-side

The app seamlessly switches between modes - if a user is logged in, their token is used; otherwise, the app token is used.

Enjoy your synchronized music experience! 🎵
