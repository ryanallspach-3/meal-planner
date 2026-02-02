'use client'

import { useEffect, useState } from 'react'

type AggregatedIngredient = {
  name: string
  totalQuantity: number | null
  unit: string | null
  usedIn: string[]
}

type GroupedIngredients = {
  [category: string]: AggregatedIngredient[]
}

export default function GroceryListPage() {
  const [groceryList, setGroceryList] = useState<string>('')
  const [aggregated, setAggregated] = useState<GroupedIngredients>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroceryList()
  }, [])

  async function loadGroceryList() {
    try {
      const res = await fetch('/api/grocery-list')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load grocery list')
      }

      setGroceryList(data.groceryList || '')
      setAggregated(data.aggregated || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grocery list')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(groceryList)
    alert('Grocery list copied to clipboard!')
  }

  const categoryOrder = [
    'produce',
    'meat',
    'seafood',
    'dairy',
    'pantry',
    'canned',
    'frozen',
    'spices',
    'baking',
    'beverages',
    'other'
  ]

  const categoryNames: Record<string, string> = {
    produce: 'Produce',
    meat: 'Meat & Poultry',
    seafood: 'Seafood',
    dairy: 'Dairy & Eggs',
    pantry: 'Pantry',
    canned: 'Canned Goods',
    frozen: 'Frozen',
    spices: 'Spices & Seasonings',
    baking: 'Baking',
    beverages: 'Beverages',
    other: 'Other'
  }

  if (loading) {
    return <div className="text-center py-12">Loading grocery list...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!groceryList) {
    return (
      <div className="text-center py-12 text-gray-500">
        No grocery list available. Add some meals to your weekly plan first.
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Grocery List</h1>
        <button
          onClick={copyToClipboard}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          Copy to Clipboard
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {categoryOrder.map((category) => {
          const items = aggregated[category]
          if (!items || items.length === 0) return null

          return (
            <div key={category} className="mb-8 last:mb-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
                {categoryNames[category] || category}
              </h2>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-3">•</span>
                    <div className="flex-1">
                      <span className="font-medium">
                        {item.totalQuantity
                          ? `${formatQuantity(item.totalQuantity)} ${item.unit || ''} `
                          : ''}
                        {item.name}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({item.usedIn.join(', ')})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatQuantity(qty: number): string {
  const rounded = Math.round(qty * 100) / 100
  const fractions: Record<number, string> = {
    0.25: '¼',
    0.33: '⅓',
    0.5: '½',
    0.66: '⅔',
    0.75: '¾'
  }

  const whole = Math.floor(rounded)
  const decimal = rounded - whole

  for (const [value, symbol] of Object.entries(fractions)) {
    if (Math.abs(decimal - parseFloat(value)) < 0.05) {
      return whole > 0 ? `${whole} ${symbol}` : symbol
    }
  }

  return rounded.toString()
}
