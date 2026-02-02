# Quick Start Guide

Get your Meal Planner up and running in 30 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (check: `node --version`)
- [ ] GitHub account
- [ ] Vercel account (sign up at vercel.com)
- [ ] Neon account (sign up at neon.tech)

## Step 1: Upgrade Node.js (5 minutes)

If you have Node < 18:

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x or higher
```

## Step 2: Create Database (5 minutes)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click "Create Project"
3. Name it "meal-planner"
4. Copy the connection string (starts with `postgresql://`)
5. In Neon SQL Editor, paste contents of `scripts/init-db.sql`
6. Click "Run" to create tables

## Step 3: Configure Environment (2 minutes)

```bash
cd meal-planner

# Create .env file
cp .env.example .env

# Edit .env and add your values
# DATABASE_URL="postgresql://..." (from step 2)
# GROCERY_LIST_API_KEY="any-random-string-here"
```

## Step 4: Test Locally (5 minutes)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000

You should see the Meal Planner home page!

## Step 5: Create PWA Icons (5 minutes)

Create two app icons:

**Option A: Use an online tool**
1. Go to https://www.favicon-generator.org/
2. Upload any image (could be a photo of food, your logo, etc.)
3. Download the generated icons
4. Save as `public/icon-192.png` (192x192)
5. Save as `public/icon-512.png` (512x512)

**Option B: Use an existing image**
1. Find any square image (PNG/JPG)
2. Resize to 192x192 and 512x512 using Preview (Mac) or Paint (Windows)
3. Save to `public/` folder

## Step 6: Deploy to Vercel (5 minutes)

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
# (Follow GitHub's instructions for creating a new repository)
git remote add origin https://github.com/yourusername/meal-planner.git
git push -u origin main

# Deploy to Vercel
npx vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? meal-planner
# - Which directory? ./
# - Override settings? No
```

## Step 7: Configure Vercel Environment (3 minutes)

1. Go to vercel.com dashboard
2. Click your meal-planner project
3. Go to Settings → Environment Variables
4. Add:
   - `DATABASE_URL` = (your Neon connection string)
   - `GROCERY_LIST_API_KEY` = (same value from .env)
5. Redeploy: `npx vercel --prod`

## Step 8: Test Live App (5 minutes)

1. Open your Vercel URL (e.g., `meal-planner-xyz.vercel.app`)
2. Add a recipe from URL:
   - Click "Recipes" → "Add Recipe"
   - Paste a recipe URL (try https://damndelicious.net/)
   - Click "Extract" → Review → "Save Recipe"
3. Create a weekly plan:
   - Click "Weekly Planner"
   - Click "+ Add meal" in any slot
   - Select your recipe
4. Generate grocery list:
   - Click "Grocery List"
   - See aggregated ingredients!

## Step 9: Install PWA on Phone (2 minutes)

**iPhone:**
1. Open the Vercel URL in Safari
2. Tap Share button (box with arrow up)
3. Scroll and tap "Add to Home Screen"
4. Name it "Meal Planner"
5. Tap "Add"

**Android:**
1. Open the Vercel URL in Chrome
2. Tap the three-dot menu
3. Tap "Install app"
4. Confirm

## Step 10: Share with Your Wife (1 minute)

Send her:
1. The Vercel URL
2. Instructions to install PWA (Step 9)

Now you both can:
- Add recipes
- Plan weekly meals
- Generate grocery lists
- Access from any device!

## Troubleshooting

### "Node version not supported"
- Make sure you upgraded to Node 18+
- Run `node --version` to verify
- Try `nvm use 18`

### "Database connection failed"
- Check `DATABASE_URL` in .env and Vercel
- Make sure Neon database is active
- Test connection: `psql $DATABASE_URL`

### "Build failed on Vercel"
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Make sure `.node-version` file exists (contains "18")

### Recipe extraction fails
- Some sites block scraping
- Try a different recipe URL
- Or use "Manual Entry" option

### Can't install PWA
- Must use Safari on iPhone (not Chrome)
- Must use Chrome on Android
- Make sure you created icon files

## What's Next?

### Import Your Existing Recipes

See `scripts/import-from-spreadsheet.md` for detailed instructions on migrating your Google Sheets data.

### Customize the App

- Change colors in `tailwind.config.ts`
- Update app name in `app/layout.tsx`
- Add custom ingredient categories in `lib/extractors/ingredient-parser.ts`

### Start Planning!

1. Add your most-used recipes
2. Plan next week's meals
3. Generate grocery list
4. Go shopping!

## Daily Usage Workflow

**Sunday evening:**
1. Open Weekly Planner
2. Add meals for the week (5 min)
3. Open Grocery List
4. Copy to clipboard
5. Share with spouse or take shopping

**During the week:**
- Check planner to see what's for dinner
- Access recipes with one tap
- Adjust plan as needed

**Ongoing:**
- Add new recipes as you find them
- Build your recipe library
- Spend less time planning, more time cooking!

## Get Help

- **Setup issues**: See SETUP.md
- **Deployment issues**: See DEPLOYMENT.md
- **Data migration**: See scripts/import-from-spreadsheet.md
- **Feature overview**: See README.md

## Feedback

As you use the app, note any issues or desired features. The codebase is well-organized and easy to extend!

---

**You're all set! Happy meal planning! 🍽️**
