// Migration script to import meals from spreadsheet data
// Run with: npx tsx scripts/migrate-meals.ts

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set in .env file')
}

const sql = neon(process.env.DATABASE_URL)

// Sample data structure - replace with actual data from your spreadsheet
const meals = [
  {
    name: 'Chicken Tacos',
    notes: 'Quick weeknight dinner',
    source_type: 'url',
    source_url: 'https://example.com/chicken-tacos',
    ingredients: [
      '2 lbs chicken breast',
      '1 packet taco seasoning',
      '12 corn tortillas',
      '1 cup shredded cheese',
      '1 cup sour cream',
      '2 tomatoes, diced',
      '1 onion, diced',
      '1 bunch cilantro'
    ]
  },
  // Add more meals here from your "Meal rotation" spreadsheet
]

async function migrate() {
  console.log('Starting migration...')

  for (const meal of meals) {
    try {
      // Insert recipe
      const result = await sql`
        INSERT INTO recipes (name, source_type, source_url, notes)
        VALUES (${meal.name}, ${meal.source_type}, ${meal.source_url || null}, ${meal.notes || null})
        RETURNING id
      `

      const recipeId = result[0].id
      console.log(`Inserted recipe: ${meal.name} (ID: ${recipeId})`)

      // Insert ingredients
      for (let i = 0; i < meal.ingredients.length; i++) {
        const ingredientText = meal.ingredients[i]

        // Parse ingredient
        const { parseIngredient } = await import('../lib/extractors/ingredient-parser')
        const parsed = parseIngredient(ingredientText)

        await sql`
          INSERT INTO ingredients (
            recipe_id, ingredient_text, quantity, unit, ingredient_name, category, sort_order
          )
          VALUES (
            ${recipeId},
            ${ingredientText},
            ${parsed.quantity},
            ${parsed.unit},
            ${parsed.ingredient_name},
            ${parsed.category},
            ${i}
          )
        `
      }

      console.log(`  Added ${meal.ingredients.length} ingredients`)
    } catch (error) {
      console.error(`Failed to migrate ${meal.name}:`, error)
    }
  }

  console.log('Migration complete!')
}

migrate().catch(console.error)
