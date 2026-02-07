import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { sql } from '@/lib/db'
import { parseIngredient } from '@/lib/extractors/ingredient-parser'

// GET /api/recipes - List all recipes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    let recipes

    if (search) {
      const searchPattern = `%${search}%`
      recipes = await sql`
        SELECT * FROM recipes
        WHERE name ILIKE ${searchPattern}
        ORDER BY name ASC
      `
    } else {
      recipes = await sql`
        SELECT * FROM recipes
        ORDER BY name ASC
      `
    }

    // Serialize dates to strings
    const serializedRecipes = recipes.map((recipe: any) => ({
      ...recipe,
      created_at: recipe.created_at?.toISOString(),
      updated_at: recipe.updated_at?.toISOString(),
    }))

    return NextResponse.json({ recipes: serializedRecipes })
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    )
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, source_type, source_url, source_file_name, source_cookbook_ref, notes, ingredients } = body

    if (!name || !source_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, source_type' },
        { status: 400 }
      )
    }

    // Insert recipe
    const result = await sql`
      INSERT INTO recipes (name, source_type, source_url, source_file_name, source_cookbook_ref, notes)
      VALUES (${name}, ${source_type}, ${source_url || null}, ${source_file_name || null}, ${source_cookbook_ref || null}, ${notes || null})
      RETURNING *
    `

    const recipe = result[0]

    // Insert ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i]

        let ingredientText: string
        let quantity: number | null
        let unit: string | null
        let ingredientName: string | null
        let category: string | null

        if (typeof ing === 'string') {
          // Plain text — parse it
          ingredientText = ing
          const parsed = parseIngredient(ing)
          quantity = parsed.quantity
          unit = parsed.unit
          ingredientName = parsed.ingredient_name
          category = parsed.category
        } else if (ing.ingredient_name) {
          // Structured data — use it directly
          ingredientText = ing.ingredient_text || ing.ingredient_name
          quantity = ing.quantity ?? null
          unit = ing.unit || null
          ingredientName = ing.ingredient_name
          // Auto-categorize based on ingredient name
          const parsed = parseIngredient(ing.ingredient_name)
          category = ing.category || parsed.category
        } else {
          // Object with ingredient_text only — parse it
          ingredientText = ing.ingredient_text
          const parsed = parseIngredient(ingredientText)
          quantity = parsed.quantity
          unit = parsed.unit
          ingredientName = parsed.ingredient_name
          category = parsed.category
        }

        await sql`
          INSERT INTO ingredients (recipe_id, ingredient_text, quantity, unit, ingredient_name, category, sort_order)
          VALUES (
            ${recipe.id},
            ${ingredientText},
            ${quantity},
            ${unit},
            ${ingredientName},
            ${category},
            ${i}
          )
        `
      }
    }

    return NextResponse.json({ recipe }, { status: 201 })
  } catch (error) {
    console.error('Failed to create recipe:', error)
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    )
  }
}
