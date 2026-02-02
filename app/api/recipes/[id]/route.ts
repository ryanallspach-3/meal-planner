import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type Params = {
  params: Promise<{
    id: string
  }>
}

// GET /api/recipes/[id] - Get a single recipe with ingredients
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const recipes = await sql`
      SELECT * FROM recipes WHERE id = ${id}
    `

    if (recipes.length === 0) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      )
    }

    const recipe = recipes[0]

    // Get ingredients
    const ingredients = await sql`
      SELECT * FROM ingredients WHERE recipe_id = ${id} ORDER BY sort_order ASC
    `

    // Serialize dates to avoid React rendering errors
    const serializedRecipe = {
      ...recipe,
      created_at: recipe.created_at?.toISOString(),
      updated_at: recipe.updated_at?.toISOString(),
      ingredients: ingredients.map((ing: any) => ({
        ...ing,
        created_at: ing.created_at?.toISOString(),
        updated_at: ing.updated_at?.toISOString(),
      }))
    }

    return NextResponse.json({
      recipe: serializedRecipe
    })
  } catch (error) {
    console.error('Failed to fetch recipe:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    )
  }
}

// PUT /api/recipes/[id] - Update a recipe
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, notes, ingredients } = body

    // Update recipe
    if (name || notes !== undefined) {
      await sql`
        UPDATE recipes
        SET
          name = COALESCE(${name}, name),
          notes = ${notes}
        WHERE id = ${id}
      `
    }

    // Update ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      // Delete existing ingredients
      await sql`DELETE FROM ingredients WHERE recipe_id = ${id}`

      // Insert new ingredients
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i]
        await sql`
          INSERT INTO ingredients (
            recipe_id, ingredient_text, quantity, unit, ingredient_name, category, sort_order
          )
          VALUES (
            ${id},
            ${ing.ingredient_text},
            ${ing.quantity || null},
            ${ing.unit || null},
            ${ing.ingredient_name || null},
            ${ing.category || null},
            ${i}
          )
        `
      }
    }

    // Fetch updated recipe
    const recipes = await sql`SELECT * FROM recipes WHERE id = ${id}`
    const updatedIngredients = await sql`SELECT * FROM ingredients WHERE recipe_id = ${id} ORDER BY sort_order ASC`

    return NextResponse.json({
      recipe: {
        ...recipes[0],
        ingredients: updatedIngredients
      }
    })
  } catch (error) {
    console.error('Failed to update recipe:', error)
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    )
  }
}

// DELETE /api/recipes/[id] - Delete a recipe
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    await sql`DELETE FROM recipes WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete recipe:', error)
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    )
  }
}
