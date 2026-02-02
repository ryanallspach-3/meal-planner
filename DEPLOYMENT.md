# Deployment Guide

This guide walks you through deploying the Meal Planner app to Vercel with a Neon Postgres database.

## Prerequisites

- GitHub account
- Vercel account (free tier)
- Neon account (free tier)

## Step 1: Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up for a free account
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:password@host/database`)
4. In the Neon SQL Editor, run the schema:
   - Copy contents of `scripts/init-db.sql`
   - Paste into SQL Editor
   - Click "Run"
5. Verify tables were created

## Step 2: Prepare Repository

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a GitHub repository and push:
```bash
git remote add origin https://github.com/yourusername/meal-planner.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
5. Click "Deploy"

### Option B: Deploy via CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login and deploy:
```bash
vercel login
vercel
```

3. Follow the prompts:
   - Link to existing project? No
   - What's your project's name? meal-planner
   - Which directory is your code in? ./
   - Auto-detected Next.js. Continue? Yes
   - Override settings? No

## Step 4: Configure Environment Variables

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Environment Variables"
3. Add the following variables:

   **DATABASE_URL**
   - Value: Your Neon connection string
   - Environment: Production, Preview, Development

   **GROCERY_LIST_API_KEY**
   - Value: Generate a random secret (e.g., `openssl rand -hex 32`)
   - Environment: Production, Preview, Development

4. Redeploy to apply environment variables:
```bash
vercel --prod
```

## Step 5: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)

## Step 6: Test Deployment

1. Visit your Vercel URL (e.g., `https://meal-planner-abc123.vercel.app`)
2. Verify the app loads
3. Test key features:
   - Add a recipe from URL
   - Create a weekly plan
   - Generate grocery list

## Step 7: Install PWA on Mobile

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Meal Planner"
5. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the three-dot menu
3. Tap "Install app" or "Add to Home Screen"
4. Confirm installation

## Monitoring and Maintenance

### Check Logs
```bash
vercel logs
```

### Monitor Database Usage
- Log into Neon dashboard
- Check "Usage" tab
- Free tier: 256 MB storage, 1 GB data transfer/month

### Database Backups
Neon automatically creates daily backups. To restore:
1. Go to Neon dashboard → "Backups"
2. Select a backup
3. Click "Restore"

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Check for TypeScript errors locally: `npm run build`

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Check Neon database is active
- Test connection locally with:
  ```bash
  psql $DATABASE_URL
  ```

### API Returns 500 Errors
- Check Vercel function logs
- Verify environment variables are set
- Check database tables exist: `\dt` in psql

### Grocery List API Unauthorized
- Verify `GROCERY_LIST_API_KEY` is set
- Pass the key in request header: `x-api-key: YOUR_KEY`

## Costs

### Vercel Free Tier
- 100 GB bandwidth/month
- Unlimited projects
- Automatic HTTPS
- No credit card required

### Neon Free Tier
- 256 MB storage
- 1 GB data transfer/month
- 1 project
- No credit card required

Both should be sufficient for personal use. Monitor usage in dashboards.

## Updating the App

1. Make changes locally
2. Test locally: `npm run dev`
3. Commit and push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```
4. Vercel automatically deploys on push to main branch

## Security Notes

- Never commit `.env` file to git
- Rotate `GROCERY_LIST_API_KEY` regularly
- Use strong passwords for Neon database
- Enable 2FA on Vercel and Neon accounts

## Next Steps

After deployment:
1. Migrate your existing recipe data (see `scripts/import-from-spreadsheet.md`)
2. Share the app URL with your wife
3. Both install the PWA on your phones
4. Start planning meals!
