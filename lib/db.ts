import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(process.env.DATABASE_URL)

// Helper types
export type Recipe = {
  id: number
  name: string
  source_type: 'url' | 'pdf' | 'docx' | 'cookbook' | 'manual'
  source_url: string | null
  source_file_name: string | null
  source_cookbook_ref: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

export type Ingredient = {
  id: number
  recipe_id: number
  ingredient_text: string
  quantity: number | null
  unit: string | null
  ingredient_name: string | null
  category: string | null
  sort_order: number
}

export type WeeklyPlan = {
  id: number
  week_number: number
  year: number
  is_active: boolean
  created_at: Date
}

export type PlannedMeal = {
  id: number
  weekly_plan_id: number
  recipe_id: number
  day_of_week: number
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  notes: string | null
}

export type RecipeFile = {
  id: number
  recipe_id: number
  file_name: string
  file_data: Buffer
  mime_type: string
  uploaded_at: Date
}
