# Importing Data from Google Sheets

This guide explains how to import your existing meal planning data from Google Sheets.

## Step 1: Export Your Spreadsheet Data

1. Open your "Meal rotation" spreadsheet
2. Go to File → Download → Comma-separated values (.csv)
3. Save as `meal-rotation.csv`

## Step 2: Convert CSV to JSON

You can use a CSV to JSON converter or write a quick script:

```javascript
// csv-to-json.js
const fs = require('fs')

const csv = fs.readFileSync('meal-rotation.csv', 'utf-8')
const lines = csv.split('\n')
const headers = lines[0].split(',')

const meals = []

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',')
  if (values[0]) { // Skip empty rows
    meals.push({
      name: values[0],
      notes: values[1] || '',
      source: values[2] || '',
    })
  }
}

fs.writeFileSync('meals.json', JSON.stringify(meals, null, 2))
console.log(`Converted ${meals.length} meals`)
```

Run: `node csv-to-json.js`

## Step 3: Create Migration Data File

Edit `scripts/migrate-meals.ts` and replace the sample data with your actual meals:

```typescript
const meals = [
  {
    name: 'Chicken Tacos',
    notes: 'Quick weeknight dinner',
    source_type: 'url', // or 'cookbook', 'pdf', 'docx', 'manual'
    source_url: 'https://example.com/recipe', // if source_type is 'url'
    source_cookbook_ref: 'Joy of Cooking p 507', // if source_type is 'cookbook'
    ingredients: [
      '2 lbs chicken breast',
      '1 packet taco seasoning',
      // ... more ingredients
    ]
  },
  // ... more meals
]
```

## Step 4: Determine Source Types

For each meal in your spreadsheet:

- **If "Location/Links" contains a URL** → `source_type: 'url'`, `source_url: 'the-url'`
- **If it references a cookbook** → `source_type: 'cookbook'`, `source_cookbook_ref: 'the-reference'`
- **If it references a PDF/DOCX file** → `source_type: 'pdf'` or `'docx'`, `source_file_name: 'the-filename'`
- **If blank** → `source_type: 'manual'`

## Step 5: Handle Ingredients

### For URL-based recipes:
Leave the `ingredients` array empty in the migration script. After running the migration, use:

```bash
npx tsx scripts/extract-from-urls.ts
```

This will automatically scrape ingredients from all recipe URLs.

### For cookbook/manual recipes:
You'll need to manually add ingredients to the migration data, or add them through the web UI after migration.

### For PDF/DOCX recipes:
1. Upload the files through the web UI (Add Recipe → Upload File)
2. Or use the extraction API programmatically

## Step 6: Run Migration

```bash
# Make sure your .env file has DATABASE_URL set
npx tsx scripts/migrate-meals.ts
```

## Step 7: Extract Ingredients from URLs

```bash
npx tsx scripts/extract-from-urls.ts
```

This will scrape all recipes that have a URL source but no ingredients yet.

## Handling the Food Folder

For the 17 recipe files in your Food folder:

### Option 1: Manual Upload (Recommended)
1. Go to the app → Add Recipe → Upload File
2. Select each PDF/DOCX file
3. The app will extract ingredients automatically
4. Review and save

### Option 2: Programmatic Upload
Create a script to batch process:

```typescript
// scripts/import-files.ts
import fs from 'fs'
import path from 'path'

const foodFolder = '/path/to/your/Food/folder'
const files = fs.readdirSync(foodFolder)

for (const file of files) {
  if (file.match(/\.(pdf|docx?)$/i)) {
    const buffer = fs.readFileSync(path.join(foodFolder, file))
    // Call your API to process the file
    // Or use the parser libraries directly
  }
}
```

## Verification

After migration, verify:

1. Check recipe count: Should have 75 dinners + 6 breakfasts = 81 recipes
2. Spot-check 10 random recipes for ingredient accuracy
3. Verify all source URLs/references are preserved

## Troubleshooting

- **Web scraping fails for some URLs**: This is common. You can manually add ingredients through the UI.
- **PDF extraction inaccurate**: Review and edit ingredients in the recipe detail page.
- **Database connection errors**: Check that your DATABASE_URL is correct and the database is accessible.

## Next Steps

After migration:
1. Create your first weekly plan
2. Add meals to the plan
3. Generate a grocery list to test the full workflow
