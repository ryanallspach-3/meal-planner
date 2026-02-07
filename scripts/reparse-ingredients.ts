// Migration script to re-parse all ingredient_text values into structured fields
// Run with: npx tsx scripts/reparse-ingredients.ts

import { neon } from '@neondatabase/serverless'
import { parseIngredient } from '../lib/extractors/ingredient-parser'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  console.log('Fetching all ingredients...')
  const ingredients = await sql`SELECT id, ingredient_text FROM ingredients`

  console.log(`Found ${ingredients.length} ingredients to re-parse`)

  let updated = 0
  for (const ing of ingredients) {
    if (!ing.ingredient_text) continue

    const parsed = parseIngredient(ing.ingredient_text)

    await sql`
      UPDATE ingredients
      SET
        quantity = ${parsed.quantity},
        unit = ${parsed.unit},
        ingredient_name = ${parsed.ingredient_name},
        category = ${parsed.category}
      WHERE id = ${ing.id}
    `
    updated++

    if (updated % 50 === 0) {
      console.log(`Updated ${updated}/${ingredients.length}...`)
    }
  }

  console.log(`Done! Updated ${updated} ingredients.`)
}

main().catch(console.error)
