import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { aggregateIngredients, formatGroceryList } from '@/lib/utils/aggregate-ingredients'

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
    const year = yearParam ? parseInt(yearParam) : now.getFullYear()
    const week = weekParam ? parseInt(weekParam) : getWeekNumber(now)

    // Get active weekly plan
    const plans = await sql`
      SELECT * FROM weekly_plans
      WHERE week_number = ${week} AND year = ${year}
    `

    if (plans.length === 0) {
      return NextResponse.json(
        { error: 'No meal plan found for this week' },
        { status: 404 }
      )
    }

    const plan = plans[0]

    // Get all ingredients from planned meals
    const ingredients = await sql`
      SELECT
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

    if (ingredients.length === 0) {
      return NextResponse.json({
        message: 'No ingredients found. Add some meals to your weekly plan first.',
        groceryList: ''
      })
    }

    // Aggregate ingredients
    const aggregated = aggregateIngredients(ingredients as any)

    // Format as markdown
    const formatted = formatGroceryList(aggregated)

    // Return both structured and formatted data
    return NextResponse.json({
      week,
      year,
      groceryList: formatted,
      aggregated
    })
  } catch (error) {
    console.error('Failed to generate grocery list:', error)
    return NextResponse.json(
      { error: 'Failed to generate grocery list' },
      { status: 500 }
    )
  }
}

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
