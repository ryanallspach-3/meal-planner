import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { sql } from '@/lib/db'

// GET /api/weekly-plan - Get current week's plan or create if doesn't exist
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const weekNumber = searchParams.get('week')
    const year = searchParams.get('year')

    // Get current week/year if not provided
    const now = new Date()
    const currentYear = year ? parseInt(year) : now.getFullYear()
    const currentWeek = weekNumber
      ? parseInt(weekNumber)
      : getWeekNumber(now)

    // Find or create weekly plan
    let plans = await sql`
      SELECT * FROM weekly_plans
      WHERE week_number = ${currentWeek} AND year = ${currentYear}
    `

    let plan
    if (plans.length === 0) {
      // Create new plan
      const result = await sql`
        INSERT INTO weekly_plans (week_number, year, is_active)
        VALUES (${currentWeek}, ${currentYear}, true)
        RETURNING *
      `
      plan = result[0]
    } else {
      plan = plans[0]
    }

    // Get all planned meals for this week
    const meals = await sql`
      SELECT pm.*, r.name as recipe_name
      FROM planned_meals pm
      JOIN recipes r ON pm.recipe_id = r.id
      WHERE pm.weekly_plan_id = ${plan.id}
      ORDER BY pm.day_of_week, pm.meal_type
    `

    return NextResponse.json({
      plan,
      meals
    })
  } catch (error) {
    console.error('Failed to fetch weekly plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly plan' },
      { status: 500 }
    )
  }
}

// POST /api/weekly-plan - Add a meal to the plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { week_number, year, recipe_id, day_of_week, meal_type, notes } = body

    if (recipe_id === undefined || day_of_week === undefined || !meal_type) {
      return NextResponse.json(
        { error: 'Missing required fields: recipe_id, day_of_week, meal_type' },
        { status: 400 }
      )
    }

    // Get or create weekly plan
    let plans = await sql`
      SELECT * FROM weekly_plans
      WHERE week_number = ${week_number} AND year = ${year}
    `

    let plan
    if (plans.length === 0) {
      const result = await sql`
        INSERT INTO weekly_plans (week_number, year, is_active)
        VALUES (${week_number}, ${year}, true)
        RETURNING *
      `
      plan = result[0]
    } else {
      plan = plans[0]
    }

    // Add meal to plan
    const result = await sql`
      INSERT INTO planned_meals (weekly_plan_id, recipe_id, day_of_week, meal_type, notes)
      VALUES (${plan.id}, ${recipe_id}, ${day_of_week}, ${meal_type}, ${notes || null})
      RETURNING *
    `

    return NextResponse.json({ meal: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to add meal to plan:', error)
    return NextResponse.json(
      { error: 'Failed to add meal to plan' },
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
