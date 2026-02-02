'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Ingredient = {
  id: number
  ingredient_text: string
  quantity: number | null
  unit: string | null
  ingredient_name: string | null
  category: string | null
}

type Recipe = {
  id: number
  name: string
  source_type: string
  source_url: string | null
  source_cookbook_ref: string | null
  notes: string | null
  ingredients: Ingredient[]
}

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedNotes, setEditedNotes] = useState('')
  const [editedIngredients, setEditedIngredients] = useState<string[]>([])

  useEffect(() => {
    loadRecipe()
  }, [id])

  async function loadRecipe() {
    try {
      const res = await fetch(`/api/recipes/${id}`)
      const data = await res.json()
      setRecipe(data.recipe)
      setEditedName(data.recipe.name)
      setEditedNotes(data.recipe.notes || '')
      setEditedIngredients(data.recipe.ingredients.map((i: Ingredient) => i.ingredient_text))
    } catch (error) {
      console.error('Failed to load recipe:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          notes: editedNotes,
          ingredients: editedIngredients.filter(i => i.trim()).map(text => ({ ingredient_text: text }))
        })
      })

      if (res.ok) {
        await loadRecipe()
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to save recipe:', error)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.push('/recipes')
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!recipe) {
    return <div className="text-center py-12">Recipe not found</div>
  }

  const ingredientsByCategory = recipe.ingredients.reduce((acc, ing) => {
    const category = ing.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(ing)
    return acc
  }, {} as Record<string, Ingredient[]>)

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/recipes" className="text-blue-600 hover:underline">
          ← Back to recipes
        </Link>
      </div>

      {editing ? (
        <div>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="text-3xl font-bold mb-4 w-full px-4 py-2 border border-gray-300 rounded-lg"
          />

          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Notes"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6"
          />

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
            {editedIngredients.map((ing, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ing}
                  onChange={(e) => {
                    const newIngs = [...editedIngredients]
                    newIngs[index] = e.target.value
                    setEditedIngredients(newIngs)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => setEditedIngredients(editedIngredients.filter((_, i) => i !== index))}
                  className="text-red-600 hover:text-red-700 px-3"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => setEditedIngredients([...editedIngredients, ''])}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
            >
              + Add Ingredient
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {recipe.name}
              </h1>
              {recipe.notes && (
                <p className="text-gray-600">{recipe.notes}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Source</h2>
            {recipe.source_type === 'url' && recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {recipe.source_url}
              </a>
            )}
            {recipe.source_type === 'cookbook' && (
              <p className="text-gray-700">{recipe.source_cookbook_ref}</p>
            )}
            {recipe.source_type === 'pdf' || recipe.source_type === 'docx' ? (
              <p className="text-gray-700 capitalize">{recipe.source_type} file</p>
            ) : null}
            {recipe.source_type === 'manual' && (
              <p className="text-gray-500">Manually entered</p>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
            {Object.entries(ingredientsByCategory).map(([category, ingredients]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <ul className="space-y-1">
                  {ingredients.map((ing) => (
                    <li key={ing.id} className="text-gray-700">
                      {ing.ingredient_text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
