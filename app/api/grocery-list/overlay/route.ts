import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getWeekNumber, getWeekYear } from '@/lib/utils/week-utils'

export const dynamic = 'force-dynamic'

// GET /api/grocery-list/overlay?week=N&year=Y
export async function GET(request: NextRequest) {
  try {
    const weekParam = request.nextUrl.searchParams.get('week')
    const yearParam = request.nextUrl.searchParams.get('year')

    const now = new Date()
    const week = weekParam ? parseInt(weekParam) : getWeekNumber(now)
    const year = yearParam ? parseInt(yearParam) : getWeekYear(now)

    const plans = await sql`
      SELECT id FROM weekly_plans
      WHERE week_number = ${week} AND year = ${year}
      LIMIT 1
    `

    if (plans.length === 0) {
      return NextResponse.json({ purchasedKeys: [], removedKeys: [], customItems: [] })
    }

    const planId = plans[0].id

    const rows = await sql`
      SELECT item_name, category, purchased, removed, custom
      FROM grocery_list_items
      WHERE weekly_plan_id = ${planId}
    `

    const purchasedKeys: string[] = []
    const removedKeys: string[] = []
    const customItems: Array<{
      id: string
      name: string
      quantities: Array<{ amount: number; unit: string }>
      category: string
      usedIn: string[]
      purchased: boolean
      custom: boolean
    }> = []

    for (const row of rows) {
      const key = `${row.category}:${row.item_name.toLowerCase()}`
      if (row.custom) {
        customItems.push({
          id: `custom-db-${row.item_name}-${row.category}`,
          name: row.item_name,
          quantities: [],
          category: row.category,
          usedIn: [],
          purchased: row.purchased,
          custom: true
        })
      } else if (row.removed) {
        removedKeys.push(key)
      } else if (row.purchased) {
        purchasedKeys.push(key)
      }
    }

    return NextResponse.json({ purchasedKeys, removedKeys, customItems })
  } catch (error) {
    console.error('Failed to load grocery list overlay:', error)
    return NextResponse.json(
      { error: 'Failed to load overlay' },
      { status: 500 }
    )
  }
}

// POST /api/grocery-list/overlay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { week, year, overlay } = body as {
      week: number
      year: number
      overlay: {
        purchasedKeys: string[]
        removedKeys: string[]
        customItems: Array<{ name: string; category: string; purchased: boolean }>
      }
    }

    if (!week || !year || !overlay) {
      return NextResponse.json({ error: 'Missing week, year, or overlay' }, { status: 400 })
    }

    const plans = await sql`
      SELECT id FROM weekly_plans
      WHERE week_number = ${week} AND year = ${year}
      LIMIT 1
    `

    if (plans.length === 0) {
      return NextResponse.json({ error: 'No plan found for this week' }, { status: 404 })
    }

    const planId = plans[0].id

    // Delete existing overlay rows for this plan, then insert current state
    await sql`DELETE FROM grocery_list_items WHERE weekly_plan_id = ${planId}`

    const rows: Array<{
      item_name: string
      category: string
      purchased: boolean
      removed: boolean
      custom: boolean
    }> = []

    // Purchased recipe-derived items
    for (const key of overlay.purchasedKeys) {
      const colonIdx = key.indexOf(':')
      if (colonIdx === -1) continue
      const category = key.substring(0, colonIdx)
      const name = key.substring(colonIdx + 1)
      rows.push({ item_name: name, category, purchased: true, removed: false, custom: false })
    }

    // Removed recipe-derived items
    for (const key of overlay.removedKeys) {
      const colonIdx = key.indexOf(':')
      if (colonIdx === -1) continue
      const category = key.substring(0, colonIdx)
      const name = key.substring(colonIdx + 1)
      rows.push({ item_name: name, category, purchased: false, removed: true, custom: false })
    }

    // Custom items
    for (const item of overlay.customItems) {
      rows.push({
        item_name: item.name,
        category: item.category,
        purchased: item.purchased,
        removed: false,
        custom: true
      })
    }

    // Insert rows one at a time (neon serverless driver batches these over HTTP)
    for (const r of rows) {
      await sql`
        INSERT INTO grocery_list_items (weekly_plan_id, item_name, category, purchased, removed, custom)
        VALUES (${planId}, ${r.item_name}, ${r.category}, ${r.purchased}, ${r.removed}, ${r.custom})
      `
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to save grocery list overlay:', error)
    return NextResponse.json(
      { error: 'Failed to save overlay' },
      { status: 500 }
    )
  }
}
