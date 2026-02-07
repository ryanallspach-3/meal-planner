'use client'

import { useEffect, useState, useRef } from 'react'

type QuantityGroup = {
  amount: number
  unit: string
}

type GroceryItem = {
  id: string
  name: string
  quantities: QuantityGroup[]
  category: string
  usedIn: string[]
  purchased: boolean
  custom: boolean
}

type StoredOverlay = {
  purchasedKeys: string[]
  removedKeys: string[]
  customItems: GroceryItem[]
}

function itemKey(item: { category: string; name: string }) {
  return `${item.category}:${item.name.toLowerCase()}`
}

const CATEGORY_ORDER = [
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

const CATEGORY_NAMES: Record<string, string> = {
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

function getStorageKey(week: number, year: number) {
  return `grocery-list-${year}-w${week}`
}

function loadOverlay(week: number, year: number): StoredOverlay | null {
  try {
    const raw = localStorage.getItem(getStorageKey(week, year))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveOverlay(week: number, year: number, overlay: StoredOverlay) {
  try {
    localStorage.setItem(getStorageKey(week, year), JSON.stringify(overlay))
  } catch {}
}

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [weekInfo, setWeekInfo] = useState<{ week: number; year: number } | null>(null)
  const [error, setError] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('other')
  const [copied, setCopied] = useState(false)
  const initialLoadDone = useRef(false)
  const apiItemKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    loadGroceryList()
  }, [])

  // Persist user modifications (purchased, removed, custom) to localStorage
  useEffect(() => {
    if (!initialLoadDone.current || !weekInfo) return
    const purchasedKeys = items.filter(i => i.purchased && !i.custom).map(itemKey)
    const removedKeys = Array.from(apiItemKeys.current).filter(
      key => !items.some(i => !i.custom && itemKey(i) === key)
    )
    const customItems = items.filter(i => i.custom)
    saveOverlay(weekInfo.week, weekInfo.year, { purchasedKeys, removedKeys, customItems })
  }, [items, weekInfo])

  async function loadGroceryList(forceRefresh = false) {
    setRefreshing(true)
    setError('')
    try {
      const res = await fetch(`/api/grocery-list?_t=${Date.now()}`)
      const data = await res.json()

      if (!res.ok) {
        setItems([])
        setError(data.error || 'Failed to load grocery list')
        return
      }

      if (data.week) setWeekInfo({ week: data.week, year: data.year })

      const aggregated: Record<string, Array<{ name: string; quantities: QuantityGroup[]; usedIn: string[] }>> =
        data.aggregated || {}

      let idCounter = 0
      const newItems: GroceryItem[] = []
      for (const category of CATEGORY_ORDER) {
        for (const item of aggregated[category] || []) {
          newItems.push({
            id: `api-${idCounter++}`,
            name: item.name,
            quantities: item.quantities || [],
            category,
            usedIn: item.usedIn || [],
            purchased: false,
            custom: false
          })
        }
      }

      // Track which items came from the API (used to detect removals on save)
      apiItemKeys.current = new Set(newItems.map(itemKey))

      // On initial load, layer saved user changes on top of fresh API data
      if (!forceRefresh && data.week) {
        const overlay = loadOverlay(data.week, data.year)
        if (overlay) {
          const purchasedSet = new Set(overlay.purchasedKeys)
          const removedSet = new Set(overlay.removedKeys)
          newItems.forEach(item => {
            if (purchasedSet.has(itemKey(item))) item.purchased = true
          })
          const merged = newItems.filter(item => !removedSet.has(itemKey(item)))
          merged.push(...overlay.customItems)
          setItems(merged)
          initialLoadDone.current = true
          return
        }
      }

      setItems(newItems)
      initialLoadDone.current = true
    } catch (err) {
      setError('Network error — check your connection')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function togglePurchased(id: string) {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, purchased: !item.purchased } : item))
    )
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function addCustomItem() {
    if (!newItemName.trim()) return
    setItems(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: newItemName.trim(),
        quantities: [],
        category: newItemCategory,
        usedIn: [],
        purchased: false,
        custom: true
      }
    ])
    setNewItemName('')
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generateCopyText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function generateCopyText(): string {
    const unpurchased = items.filter(i => !i.purchased)
    if (unpurchased.length === 0) return 'All items purchased!'

    let output = 'Grocery List\n\n'
    for (const category of CATEGORY_ORDER) {
      const categoryItems = unpurchased.filter(i => i.category === category)
      if (categoryItems.length === 0) continue
      output += `${CATEGORY_NAMES[category] || category}\n`
      for (const item of categoryItems) {
        const qtyStr = formatQuantities(item.quantities)
        const source = item.usedIn.length > 0 ? ` (${item.usedIn.join(', ')})` : ''
        if (qtyStr) {
          output += `- ${item.name} — ${qtyStr}${source}\n`
        } else {
          output += `- ${item.name}${source}\n`
        }
      }
      output += '\n'
    }
    return output.trim()
  }

  if (loading) {
    return <div className="text-center py-12">Loading grocery list...</div>
  }

  const purchasedCount = items.filter(i => i.purchased).length
  const totalCount = items.length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Grocery List</h1>
        <div className="flex gap-2">
          <button
            onClick={() => loadGroceryList(true)}
            disabled={refreshing}
            className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy List'}
          </button>
        </div>
      </div>

      {weekInfo && (
        <p className="text-sm text-gray-500 mb-1">
          Showing Week {weekInfo.week}, {weekInfo.year} — check your planner shows the same week
        </p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3">
          {error}
        </div>
      )}

      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{purchasedCount} of {totalCount} purchased</span>
            {purchasedCount === totalCount && (
              <span className="text-green-600 font-medium">All done!</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(purchasedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
            placeholder="Add an item..."
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {CATEGORY_ORDER.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_NAMES[cat]}</option>
            ))}
          </select>
          <button
            onClick={addCustomItem}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white shadow rounded-lg">
          <p>Your grocery list is empty.</p>
          <p className="text-sm mt-1">Add meals to your weekly planner, or add items above.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {CATEGORY_ORDER.map((category) => {
            const categoryItems = items.filter(i => i.category === category)
            if (categoryItems.length === 0) return null

            return (
              <div key={category} className="border-b border-gray-200 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {CATEGORY_NAMES[category]}
                  </h2>
                </div>
                <ul>
                  {categoryItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => togglePurchased(item.id)}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer flex-shrink-0"
                      />
                      <div className={`flex-1 min-w-0 ${item.purchased ? 'line-through text-gray-400' : ''}`}>
                        <span className="font-medium">{item.name}</span>
                        {item.quantities.length > 0 && (
                          <span className={`ml-2 ${item.purchased ? 'text-gray-300' : 'text-gray-500'}`}>
                            — {formatQuantities(item.quantities)}
                          </span>
                        )}
                        {item.usedIn.length > 0 && (
                          <span className={`text-sm ml-2 ${item.purchased ? 'text-gray-300' : 'text-gray-400'}`}>
                            ({item.usedIn.join(', ')})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-500 flex-shrink-0 p-2 text-lg leading-none"
                        title="Remove"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatQuantities(quantities: QuantityGroup[]): string {
  if (quantities.length === 0) return ''
  return quantities.map(q => `${formatQuantity(q.amount)} ${q.unit}`).join(', ')
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
      return whole > 0 ? `${whole}${symbol}` : symbol
    }
  }

  return rounded.toString()
}
