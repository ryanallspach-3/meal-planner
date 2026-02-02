// Script to batch extract recipes from URLs
// Run with: npx tsx scripts/extract-from-urls.ts

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set in .env file')
}

const sql = neon(process.env.DATABASE_URL)

async function extractRecipes() {
  console.log('Extracting recipes from URLs...')

  // Get all recipes with URL sources that don't have ingredients yet
  const recipes = await sql`
    SELECT r.* FROM recipes r
    WHERE r.source_type = 'url'
    AND r.source_url IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM ingredients i WHERE i.recipe_id = r.id
    )
  `

  console.log(`Found ${recipes.length} recipes to process`)

  for (const recipe of recipes) {
    try {
      console.log(`Processing: ${recipe.name}`)

      const { scrapeRecipeFromUrl } = await import('../lib/extractors/web-scraper')
      const scraped = await scrapeRecipeFromUrl(recipe.source_url!)

      // Insert ingredients
      for (let i = 0; i < scraped.ingredients.length; i++) {
        const ingredientText = scraped.ingredients[i]

        const { parseIngredient } = await import('../lib/extractors/ingredient-parser')
        const parsed = parseIngredient(ingredientText)

        await sql`
          INSERT INTO ingredients (
            recipe_id, ingredient_text, quantity, unit, ingredient_name, category, sort_order
          )
          VALUES (
            ${recipe.id},
            ${ingredientText},
            ${parsed.quantity},
            ${parsed.unit},
            ${parsed.ingredient_name},
            ${parsed.category},
            ${i}
          )
        `
      }

      console.log(`  ✓ Added ${scraped.ingredients.length} ingredients`)

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log('Done!')
}

extractRecipes().catch(console.error)
