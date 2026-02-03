'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Recipe = {
  id: number
  name: string
  source_type: string
  source_url: string | null
  source_cookbook_ref: string | null
  notes: string | null
}

export default function RecipesPage() {
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

  function getSourceDisplay(recipe: Recipe) {
    if (recipe.source_type === 'url' && recipe.source_url) {
      return (
        <a
          href={recipe.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          View online
        </a>
      )
    }
    if (recipe.source_type === 'cookbook' && recipe.source_cookbook_ref) {
      return <span className="text-sm text-gray-600">{recipe.source_cookbook_ref}</span>
    }
    return <span className="text-sm text-gray-500 capitalize">{recipe.source_type}</span>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recipe Library</h1>
        <Link
          href="/recipes/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          Add Recipe
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading recipes...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No recipes found. {search && 'Try a different search or '}
          <Link href="/recipes/add" className="text-blue-600 hover:underline">
            add your first recipe
          </Link>
          .
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="flex justify-between items-start px-6 py-4 hover:bg-gray-50">
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="flex-1"
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {recipe.name}
                  </h3>
                  {recipe.notes && (
                    <p className="mt-1 text-sm text-gray-600">{recipe.notes}</p>
                  )}
                </Link>
                <div className="ml-4 flex-shrink-0">
                  {getSourceDisplay(recipe)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
