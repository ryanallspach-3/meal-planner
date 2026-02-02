import { NextRequest, NextResponse } from 'next/server'
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
        const ingredientText = typeof ing === 'string' ? ing : ing.ingredient_text

        // Parse the ingredient
        const parsed = parseIngredient(ingredientText)

        await sql`
          INSERT INTO ingredients (recipe_id, ingredient_text, quantity, unit, ingredient_name, category, sort_order)
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
