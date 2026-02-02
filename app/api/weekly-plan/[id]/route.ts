import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type Params = {
  params: Promise<{
    id: string
  }>
}

// DELETE /api/weekly-plan/[id] - Remove a meal from the plan
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    await sql`DELETE FROM planned_meals WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete planned meal:', error)
    return NextResponse.json(
      { error: 'Failed to delete planned meal' },
      { status: 500 }
    )
  }
}
