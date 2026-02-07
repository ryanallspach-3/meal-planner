import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { aggregateIngredients, formatGroceryList } from '@/lib/utils/aggregate-ingredients'
import { parseIngredient } from '@/lib/extractors/ingredient-parser'
import { getWeekNumber, getWeekYear } from '@/lib/utils/week-utils'

// Force dynamic rendering (required for request.headers)
export const dynamic = 'force-dynamic'

// GET /api/grocery-list - Generate grocery list for current week
export async function GET(request: NextRequest) {
  try {
    // Check API key only if one is provided (for external API access)
    const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('apiKey')
    const expectedKey = process.env.GROCERY_LIST_API_KEY

    // If an API key is provided, verify it matches
    if (apiKey && expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get week/year from query params or use current
    const weekParam = request.nextUrl.searchParams.get('week')
    const yearParam = request.nextUrl.searchParams.get('year')

    const now = new Date()
    const week = weekParam ? parseInt(weekParam) : getWeekNumber(now)
    const year = yearParam ? parseInt(yearParam) : getWeekYear(now)

    // Get active weekly plan
    const plans = await sql`
      SELECT * FROM weekly_plans
      WHERE week_number = ${week} AND year = ${year}
      ORDER BY id ASC
    `

    if (plans.length === 0) {
      return NextResponse.json(
        { error: 'No meal plan found for this week' },
        { status: 404 }
      )
    }

    const plan = plans[0]

    // Get all planned meals for this plan (used for debug info)
    const plannedMeals = await sql`
      SELECT pm.id, pm.recipe_id, r.name as recipe_name
      FROM planned_meals pm
      JOIN recipes r ON pm.recipe_id = r.id
      WHERE pm.weekly_plan_id = ${plan.id}
    `

    // Get all ingredients from planned meals
    const rawIngredients = await sql`
      SELECT DISTINCT
        i.ingredient_text,
        i.quantity,
        i.unit,
        i.ingredient_name,
        i.category,
        r.name as recipe_name
      FROM planned_meals pm
      JOIN recipes r ON pm.recipe_id = r.id
      JOIN ingredients i ON i.recipe_id = r.id
      WHERE pm.weekly_plan_id = ${plan.id}
      ORDER BY i.category, i.ingredient_name
    `

    if (rawIngredients.length === 0) {
      return NextResponse.json({
        message: 'No ingredients found. Add some meals to your weekly plan first.',
        groceryList: '',
        week,
        year,
        _debug: { plan_id: plan.id, meal_count: plannedMeals.length, fetched_at: new Date().toISOString() }
      })
    }

    // Parse ingredients on-the-fly if structured fields are null
    const ingredients = rawIngredients.map((ing: any) => {
      if (ing.ingredient_name) {
        return ing
      }
      // Parse the raw text
      const parsed = parseIngredient(ing.ingredient_text || '')
      return {
        ...ing,
        quantity: parsed.quantity,
        unit: parsed.unit,
        ingredient_name: parsed.ingredient_name,
        category: parsed.category || ing.category
      }
    })

    // Aggregate ingredients
    const aggregated = aggregateIngredients(ingredients)

    // Format as markdown
    const formatted = formatGroceryList(aggregated)

    // Return both structured and formatted data
    return NextResponse.json({
      week,
      year,
      groceryList: formatted,
      aggregated,
      _debug: { plan_id: plan.id, meal_count: plannedMeals.length, fetched_at: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Failed to generate grocery list:', error)
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    )
  }
}
