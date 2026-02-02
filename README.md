# Meal Planner PWA

A Progressive Web App for weekly meal planning and grocery list generation.

## Features

- Recipe library with automated ingredient extraction from web, PDFs, and DOCX files
- Weekly meal planner with mobile-friendly interface
- Grocery list generation with ingredient aggregation and categorization
- Installable on iOS and Android home screens
- Offline support

## Setup

### Prerequisites

- Node.js 18+ (your system has v16, consider upgrading for production)
- Neon Postgres database (free tier available at neon.tech)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your database credentials:
```bash
DATABASE_URL="postgresql://user:password@host/database"
GROCERY_LIST_API_KEY="your-random-secret-key-here"
```

3. Initialize the database:
```bash
# Connect to your Neon database and run:
psql $DATABASE_URL < scripts/init-db.sql
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Create a Vercel account at vercel.com
2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your Neon Postgres connection string
   - `GROCERY_LIST_API_KEY` - Random secret key for API authentication

5. Create a Neon database:
   - Go to neon.tech and create a free account
   - Create a new database
   - Copy the connection string to your Vercel environment variables
   - Run the init-db.sql script via the Neon SQL editor

## Data Migration

See the `scripts/` directory for migration scripts to import your existing data from Google Sheets.

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home Screen"

## Grocery List API

The grocery list API is available at `/api/grocery-list` and requires authentication:

```bash
curl -H "x-api-key: YOUR_API_KEY" https://your-domain.vercel.app/api/grocery-list
```

## Technology Stack

- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Neon Postgres (serverless Postgres)
- Cheerio (web scraping)
- pdf-parse (PDF extraction)
- mammoth (DOCX extraction)

## Project Structure

```
meal-planner/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── recipes/           # Recipe management pages
│   ├── planner/           # Weekly planner page
│   └── grocery-list/      # Grocery list page
├── components/            # React components
├── lib/                   # Utilities and libraries
│   ├── extractors/        # Recipe extraction logic
│   └── utils/             # Helper functions
├── scripts/               # Database and migration scripts
└── public/                # Static assets

## Notes

- Your current Node version (v16.17.0) is below the recommended v18+. While the app may work, some packages have warnings. Consider upgrading Node.js for production deployment.
- Vercel Postgres has been deprecated in favor of Neon. This project uses Neon as the database provider.
- PWA icons need to be created at 192x192 and 512x512 pixels. Place them in `public/icon-192.png` and `public/icon-512.png`.
```
