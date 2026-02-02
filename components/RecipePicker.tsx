'use client'

import { useEffect, useState } from 'react'

type Recipe = {
  id: number
  name: string
}

type RecipePickerProps = {
  onSelect: (recipeId: number) => void
  onClose: () => void
}

export default function RecipePicker({ onSelect, onClose }: RecipePickerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipes()
  }, [search])

  async function loadRecipes() {
    try {
      const url = search
        ? `/api/recipes?search=${encodeURIComponent(search)}`
        : '/api/recipes'
      const res = await fetch(url)
      const data = await res.json()
      setRecipes(data.recipes || [])
    } catch (error) {
      console.error('Failed to load recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Recipe</h2>
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading recipes...</div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recipes found. {search && 'Try a different search.'}
            </div>
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => onSelect(recipe.id)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {recipe.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
