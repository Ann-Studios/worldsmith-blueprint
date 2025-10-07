# 🚀 Frontend Deployment Guide

## Environment Variables Required

Before deploying, you need to set up these environment variables:

### Required Variables:
- `VITE_API_URL` - Your Render backend URL (e.g., `https://your-app.onrender.com`)

### Optional Variables (if using Supabase):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add `VITE_API_URL` with your Render backend URL

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

3. **Set Environment Variables in Netlify Dashboard:**
   - Go to Site settings > Environment variables
   - Add `VITE_API_URL` with your Render backend URL

### Option 3: Render (Static Site)

1. **Create new Static Site on Render**
2. **Connect your GitHub repository**
3. **Configure:**
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. **Add Environment Variables:**
   - `VITE_API_URL` = your Render backend URL

### Option 4: GitHub Pages

1. **Enable GitHub Pages in repository settings**
2. **Push to main branch** (GitHub Actions will auto-deploy)
3. **Set Environment Variables in GitHub:**
   - Go to Settings > Secrets and variables > Actions
   - Add `VITE_API_URL` as a repository secret

## Quick Deploy Commands

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Deploy to Render (via Git push)
git add .
git commit -m "Deploy frontend"
git push origin main
```

## Post-Deployment Checklist

- [ ] Set `VITE_API_URL` environment variable
- [ ] Test API connection
- [ ] Verify authentication flow
- [ ] Check all features work correctly
- [ ] Update CORS settings on backend if needed
