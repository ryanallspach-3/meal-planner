'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import RecipePicker from '@/components/RecipePicker'

type PlannedMeal = {
  id: number
  recipe_id: number
  recipe_name: string
  day_of_week: number
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  notes: string | null
}

type WeeklyPlan = {
  id: number
  week_number: number
  year: number
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MEAL_TYPES: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner']

export default function PlannerPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [meals, setMeals] = useState<PlannedMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; mealType: string } | null>(null)

  useEffect(() => {
    loadWeeklyPlan()
  }, [])

  async function loadWeeklyPlan() {
    try {
      const res = await fetch('/api/weekly-plan')
      const data = await res.json()
      setPlan(data.plan)
      setMeals(data.meals || [])
    } catch (error) {
      console.error('Failed to load weekly plan:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMeal(day: number, mealType: string) {
    setSelectedSlot({ day, mealType })
    setShowPicker(true)
  }

  async function handleRecipeSelected(recipeId: number) {
    if (!selectedSlot || !plan) return

    try {
      const res = await fetch('/api/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_number: plan.week_number,
          year: plan.year,
          recipe_id: recipeId,
          day_of_week: selectedSlot.day,
          meal_type: selectedSlot.mealType
        })
      })

      if (res.ok) {
        await loadWeeklyPlan()
      }
    } catch (error) {
      console.error('Failed to add meal:', error)
    } finally {
      setShowPicker(false)
      setSelectedSlot(null)
    }
  }

  async function handleRemoveMeal(mealId: number) {
    try {
      const res = await fetch(`/api/weekly-plan/${mealId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await loadWeeklyPlan()
      }
    } catch (error) {
      console.error('Failed to remove meal:', error)
    }
  }

  function getMealsForSlot(day: number, mealType: string): PlannedMeal[] {
    return meals.filter(m => m.day_of_week === day && m.meal_type === mealType)
  }

  async function navigateWeek(offset: number) {
    if (!plan) return

    const newWeek = plan.week_number + offset
    try {
      const res = await fetch(`/api/weekly-plan?week=${newWeek}&year=${plan.year}`)
      const data = await res.json()
      setPlan(data.plan)
      setMeals(data.meals || [])
    } catch (error) {
      console.error('Failed to navigate week:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Weekly Meal Planner</h1>
        {plan && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              ← Previous
            </button>
            <span className="text-lg font-medium">
              Week {plan.week_number}, {plan.year}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Day
                </th>
                {MEAL_TYPES.map((mealType) => (
                  <th
                    key={mealType}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {mealType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {DAYS.map((day, dayIndex) => (
                <tr key={day}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {day}
                  </td>
                  {MEAL_TYPES.map((mealType) => {
                    const slotMeals = getMealsForSlot(dayIndex, mealType)
                    return (
                      <td key={mealType} className="px-6 py-4">
                        <div className="space-y-2">
                          {slotMeals.map((meal) => (
                            <div
                              key={meal.id}
                              className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm"
                            >
                              <div className="flex justify-between items-start">
                                <Link
                                  href={`/recipes/${meal.recipe_id}`}
                                  className="font-medium text-blue-900 hover:underline"
                                >
                                  {meal.recipe_name}
                                </Link>
                                <button
                                  onClick={() => handleRemoveMeal(meal.id)}
                                  className="text-blue-600 hover:text-blue-800 ml-2"
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddMeal(dayIndex, mealType)}
                            className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded px-3 py-2 border border-dashed border-gray-300 hover:border-blue-300"
                          >
                            + Add meal
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPicker && (
        <RecipePicker
          onSelect={handleRecipeSelected}
          onClose={() => {
            setShowPicker(false)
            setSelectedSlot(null)
          }}
        />
      )}
    </div>
  )
}
