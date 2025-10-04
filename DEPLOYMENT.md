# Frontend Deployment Guide

## Environment Variables Required

Before deploying, you need to set these environment variables:

```bash
VITE_API_URL=https://your-backend-domain.com/api
VITE_API_HOST=your-backend-domain.com
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

## Deployment Steps

1. **Set Environment Variables** in your deployment platform (Vercel/Netlify/etc.)
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Node Version**: 18+ (check package.json)

## Configuration Files Updated

- ✅ `vite.config.js` - Now handles dev/prod modes
- ✅ `config.js` - Centralized config with fallbacks
- ✅ Build tested successfully

## For Vercel Deployment

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

## Backend Connection

The frontend will connect to your deployed backend using:
- HTTP API calls via `VITE_API_URL`
- WebSocket connections via `VITE_API_HOST`

Make sure your backend CORS is configured for your frontend domain.
