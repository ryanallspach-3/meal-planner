'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseIngredient } from '@/lib/extractors/ingredient-parser'

type ExtractedRecipe = {
  name: string
  ingredients: string[]
  servings?: number
}

type EditableIngredient = {
  name: string
  quantity: string
  unit: string
}

// Convert parsed ingredient to editable format
function parseIngredientText(text: string): EditableIngredient {
  const parsed = parseIngredient(text)
  return {
    name: parsed.ingredient_name || text.trim(),
    quantity: parsed.quantity != null ? String(parsed.quantity) : '',
    unit: parsed.unit || ''
  }
}

export default function AddRecipePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'url' | 'file' | 'manual'>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [cookbookRef, setCookbookRef] = useState('')
  const [notes, setNotes] = useState('')
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([{ name: '', quantity: '', unit: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleExtractUrl() {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to extract recipe')
      }

      const data = await res.json()
      const recipe: ExtractedRecipe = data.recipe

      setName(recipe.name)
      setIngredients(
        recipe.ingredients.length > 0
          ? recipe.ingredients.map(parseIngredientText)
          : [{ name: '', quantity: '', unit: '' }]
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract recipe')
    } finally {
      setLoading(false)
    }
  }

  async function handleExtractFile() {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to extract recipe')
      }

      const data = await res.json()
      const recipe: ExtractedRecipe = data.recipe

      setName(recipe.name)
      setIngredients(
        recipe.ingredients.length > 0
          ? recipe.ingredients.map(parseIngredientText)
          : [{ name: '', quantity: '', unit: '' }]
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract recipe')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRecipe() {
    if (!name) {
      setError('Please enter a recipe name')
      return
    }

    const structuredIngredients = ingredients
      .filter(i => i.name.trim())
      .map(i => {
        const qty = parseQuantityValue(i.quantity)
        const displayQty = i.quantity.trim() ? `${i.quantity.trim()} ` : ''
        const displayUnit = i.unit.trim() ? `${i.unit.trim()} ` : ''
        return {
          ingredient_text: `${displayQty}${displayUnit}${i.name.trim()}`.trim(),
          quantity: qty,
          unit: i.unit.trim() || null,
          ingredient_name: i.name.trim()
        }
      })

    setLoading(true)
    setError('')

    try {
      let sourceType: string
      let sourceUrl: string | null = null
      let sourceFileName: string | null = null
      let sourceCookbookRef: string | null = null

      if (mode === 'url') {
        sourceType = 'url'
        sourceUrl = url || null
      } else if (mode === 'file') {
        sourceType = file?.name.endsWith('.pdf') ? 'pdf' : 'docx'
        sourceFileName = file?.name || null
      } else {
        sourceType = cookbookRef ? 'cookbook' : 'manual'
        sourceCookbookRef = cookbookRef || null
      }

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          source_type: sourceType,
          source_url: sourceUrl,
          source_file_name: sourceFileName,
          source_cookbook_ref: sourceCookbookRef,
          notes,
          ingredients: structuredIngredients
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save recipe')
      }

      router.push('/recipes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
      setLoading(false)
    }
  }

  function parseQuantityValue(str: string): number | null {
    const s = str.trim()
    if (!s) return null

    if (s.includes('/')) {
      const parts = s.split(/\s+/)
      let total = 0
      for (const part of parts) {
        if (part.includes('/')) {
          const [num, den] = part.split('/').map(Number)
          if (!isNaN(num) && !isNaN(den) && den !== 0) {
            total += num / den
          }
        } else {
          const n = parseFloat(part)
          if (!isNaN(n)) total += n
        }
      }
      return total || null
    }

    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  function updateIngredient(index: number, field: keyof EditableIngredient, value: string) {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setIngredients(newIngredients)
  }

  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }])
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Recipe</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How do you want to add this recipe?
        </label>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode('url')}
            className={`px-4 py-2 rounded-lg font-medium ${
              mode === 'url'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            From URL
          </button>
          <button
            onClick={() => setMode('file')}
            className={`px-4 py-2 rounded-lg font-medium ${
              mode === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-lg font-medium ${
              mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manual Entry
          </button>
        </div>

        {mode === 'url' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleExtractUrl}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Extracting...' : 'Extract'}
              </button>
            </div>
          </div>
        )}

        {mode === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF or DOCX
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleExtractFile}
                disabled={loading || !file}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Extracting...' : 'Extract'}
              </button>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cookbook Reference (optional)
            </label>
            <input
              type="text"
              value={cookbookRef}
              onChange={(e) => setCookbookRef(e.target.value)}
              placeholder="e.g., Joy of Cooking p 507"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipe Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter recipe name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this recipe"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Ingredients
          </label>
          <button
            onClick={addIngredient}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Add Ingredient
          </button>
        </div>

        <div className="grid grid-cols-[1fr_80px_100px_auto] gap-2 mb-2 text-sm font-medium text-gray-500">
          <span>Ingredient</span>
          <span>Qty</span>
          <span>Unit</span>
          <span></span>
        </div>

        {ingredients.map((ingredient, index) => (
          <div key={index} className="grid grid-cols-[1fr_80px_100px_auto] gap-2 mb-2">
            <input
              type="text"
              value={ingredient.name}
              onChange={(e) => updateIngredient(index, 'name', e.target.value)}
              placeholder="e.g. Flour"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={ingredient.quantity}
              onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
              placeholder="2"
              className="px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={ingredient.unit}
              onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
              placeholder="cups"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {ingredients.length > 1 && (
              <button
                onClick={() => removeIngredient(index)}
                className="text-red-600 hover:text-red-700 px-3"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSaveRecipe}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Recipe'}
        </button>
        <button
          onClick={() => router.push('/recipes')}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
