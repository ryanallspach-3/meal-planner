# Setup Instructions

## Important: Node.js Version

This project requires Node.js 18 or higher. Your current system has Node.js 16.17.0.

### Upgrading Node.js

**Option 1: Using nvm (Recommended)**
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 18
nvm install 18
nvm use 18
nvm alias default 18
```

**Option 2: Using Homebrew (macOS)**
```bash
brew update
brew upgrade node
```

**Option 3: Download from nodejs.org**
Visit https://nodejs.org and download the LTS version (18+)

### Verify Installation
```bash
node --version  # Should show v18.x.x or higher
```

## Local Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env` and add your database credentials:
```
DATABASE_URL="postgresql://user:password@host/database"
GROCERY_LIST_API_KEY="generate-random-key-here"
```

4. Initialize database:
   - Create a Neon database at neon.tech
   - Run the SQL schema in `scripts/init-db.sql`

5. Create PWA icons:
   - Create two PNG images for the app icon
   - Save as `public/icon-192.png` (192x192 pixels)
   - Save as `public/icon-512.png` (512x512 pixels)
   - You can use any image editor or online tool

6. Start development server:
```bash
npm run dev
```

7. Open http://localhost:3000

## Quick Start Guide

### 1. Add Your First Recipe

**From a URL:**
1. Go to "Recipes" → "Add Recipe"
2. Select "From URL"
3. Paste a recipe URL (e.g., from AllRecipes, Food Network, etc.)
4. Click "Extract" - the app will automatically pull ingredients
5. Review and click "Save Recipe"

**From a PDF/DOCX:**
1. Go to "Recipes" → "Add Recipe"
2. Select "Upload File"
3. Choose a PDF or DOCX recipe file
4. Click "Extract"
5. Review ingredients and click "Save Recipe"

**Manual Entry:**
1. Go to "Recipes" → "Add Recipe"
2. Select "Manual Entry"
3. Enter recipe name and ingredients
4. Optionally add a cookbook reference
5. Click "Save Recipe"

### 2. Create a Weekly Plan

1. Go to "Weekly Planner"
2. Click "+ Add meal" in any day/meal slot
3. Select a recipe from your library
4. Repeat for other meals throughout the week

### 3. Generate Grocery List

1. Add several meals to your weekly plan
2. Go to "Grocery List"
3. The app automatically:
   - Aggregates all ingredients from your planned meals
   - Combines quantities (e.g., 2 cups + 1 cup = 3 cups)
   - Groups by category (Produce, Meat, Dairy, etc.)
4. Click "Copy to Clipboard" to share

## Development Notes

### Running Without Database

If you want to test the UI without setting up a database, you can:

1. Comment out database calls in API routes
2. Return mock data instead
3. This lets you test the interface before deployment

### Testing PWA Features

PWA features (offline mode, install prompt) only work:
- Over HTTPS in production
- Or on localhost in development

### TypeScript Errors

If you see TypeScript errors, run:
```bash
npm run build
```

This will show all type errors that need to be fixed.

## Common Issues

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Database connection fails
- Verify DATABASE_URL is correct
- Check Neon database is active
- Test connection: `psql $DATABASE_URL`

### Build fails on Vercel
- Check that `.node-version` file exists (should contain "18")
- Verify all dependencies are in `package.json`
- Check Vercel build logs for specific errors

## Next Steps

1. Read `DEPLOYMENT.md` for production deployment instructions
2. Read `scripts/import-from-spreadsheet.md` for data migration
3. Customize the app:
   - Change colors in `tailwind.config.ts`
   - Update app name in `app/layout.tsx`
   - Add custom ingredient categories in `lib/extractors/ingredient-parser.ts`

## Getting Help

- Check the README.md for feature overview
- Review DEPLOYMENT.md for deployment issues
- Check Next.js docs: https://nextjs.org/docs
- Check Neon docs: https://neon.tech/docs

## Project Structure

```
meal-planner/
├── app/                          # Next.js app router
│   ├── api/                      # API endpoints
│   │   ├── recipes/              # Recipe CRUD
│   │   ├── extract-recipe/       # URL/file extraction
│   │   ├── weekly-plan/          # Weekly planning
│   │   └── grocery-list/         # Grocery list generation
│   ├── recipes/                  # Recipe pages
│   ├── planner/                  # Weekly planner
│   ├── grocery-list/             # Grocery list view
│   └── layout.tsx                # Root layout with nav
├── components/                   # React components
│   └── RecipePicker.tsx          # Recipe selection modal
├── lib/                          # Business logic
│   ├── db.ts                     # Database client
│   ├── extractors/               # Recipe extraction
│   │   ├── ingredient-parser.ts  # Parse ingredient text
│   │   ├── web-scraper.ts        # Extract from URLs
│   │   ├── pdf-parser.ts         # Extract from PDFs
│   │   └── docx-parser.ts        # Extract from DOCX
│   └── utils/                    # Utilities
│       └── aggregate-ingredients.ts  # Grocery list logic
├── scripts/                      # Migration and utilities
│   ├── init-db.sql               # Database schema
│   ├── migrate-meals.ts          # Import from data
│   └── extract-from-urls.ts      # Batch scraping
└── public/                       # Static files
    ├── manifest.json             # PWA manifest
    └── sw.js                     # Service worker
```
