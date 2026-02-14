# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint with Next.js rules
npm start        # Start production server
```

No test framework is configured. Database schema is initialized via `psql $DATABASE_URL < scripts/init-db.sql`.

## Architecture

This is a **Next.js 14 App Router** PWA for weekly meal planning and grocery list generation. It uses TypeScript, Tailwind CSS, and Neon Postgres (`@neondatabase/serverless`).

### Core Modules

**Recipe Management** — Users add recipes via URL extraction (Cheerio + schema.org JSON-LD), PDF upload (`pdf-parse`), DOCX upload (`mammoth`), or manual entry. All extraction flows go through `/api/extract-recipe`, which dispatches to the appropriate extractor in `lib/extractors/`. The ingredient parser (`lib/extractors/ingredient-parser.ts`) converts raw text like "2 1/2 cups flour" into structured data with quantity, unit, name, and auto-assigned category (140+ keyword mappings across 11 categories).

**Weekly Planner** — A 7-day grid (Saturday-based weeks, handled by `lib/utils/week-utils.ts`). Recipes are linked to days and meal types (breakfast/lunch/dinner) via `planned_meals`. The `RecipePicker` component provides a modal for recipe selection.

**Grocery List** — Computed on-the-fly from the current week's planned meals. `lib/utils/aggregate-ingredients.ts` normalizes units, sums quantities for matching ingredients, groups by category, and tracks source recipes. Purchased/removed/custom item state is synced to the database via `/api/grocery-list/overlay` so it persists across devices.

### Database Schema (6 tables)

- `recipes` — metadata with `source_type` enum (url|pdf|docx|cookbook|manual)
- `ingredients` — parsed ingredients linked to recipes (quantity, unit, name, category)
- `weekly_plans` — one per week, keyed by (week_number, year)
- `planned_meals` — links recipes to plans with day_of_week and meal_type
- `recipe_files` — binary storage (BYTEA) for uploaded PDF/DOCX files
- `grocery_list_items` — per-plan overlay for purchased/removed/custom grocery items (syncs across devices)

### API Routes

All under `app/api/`:
- `recipes/` — CRUD for recipes (GET list with search, POST create)
- `recipes/[id]/` — GET/PUT/DELETE individual recipes
- `extract-recipe/` — POST to extract from URL or uploaded file
- `weekly-plan/` — GET (auto-creates current week), POST (add meal)
- `weekly-plan/[id]/` — DELETE meal from plan
- `grocery-list/` — GET (requires `x-api-key` header matching `GROCERY_LIST_API_KEY` env var)
- `grocery-list/overlay/` — GET/POST overlay state (purchased, removed, custom items) per weekly plan

### Environment Variables

- `DATABASE_URL` — Neon Postgres connection string
- `GROCERY_LIST_API_KEY` — Secret key for grocery list API authentication

### Path Aliases

`@/*` maps to `./` (e.g., `import { sql } from '@/lib/db'`).
