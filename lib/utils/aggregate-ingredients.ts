type Ingredient = {
  quantity: number | null
  unit: string | null
  ingredient_name: string | null
  category: string | null
  recipe_name: string
}

type AggregatedIngredient = {
  name: string
  totalQuantity: number | null
  unit: string | null
  category: string
  usedIn: string[]
}

type GroupedIngredients = {
  [category: string]: AggregatedIngredient[]
}

// Unit conversion to normalize units
const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  // Volume
  'cup': { base: 'cup', factor: 1 },
  'cups': { base: 'cup', factor: 1 },
  'tablespoon': { base: 'tablespoon', factor: 1 },
  'tablespoons': { base: 'tablespoon', factor: 1 },
  'tbsp': { base: 'tablespoon', factor: 1 },
  'teaspoon': { base: 'teaspoon', factor: 1 },
  'teaspoons': { base: 'teaspoon', factor: 1 },
  'tsp': { base: 'teaspoon', factor: 1 },

  // Weight
  'ounce': { base: 'ounce', factor: 1 },
  'ounces': { base: 'ounce', factor: 1 },
  'oz': { base: 'ounce', factor: 1 },
  'pound': { base: 'pound', factor: 1 },
  'pounds': { base: 'pound', factor: 1 },
  'lb': { base: 'pound', factor: 1 },
  'lbs': { base: 'pound', factor: 1 },
  'gram': { base: 'gram', factor: 1 },
  'grams': { base: 'gram', factor: 1 },
  'g': { base: 'gram', factor: 1 },

  // Count
  'clove': { base: 'clove', factor: 1 },
  'cloves': { base: 'clove', factor: 1 },
  'can': { base: 'can', factor: 1 },
  'cans': { base: 'can', factor: 1 },
  'package': { base: 'package', factor: 1 },
  'packages': { base: 'package', factor: 1 },
}

function normalizeUnit(unit: string | null): { base: string; factor: number } | null {
  if (!unit) return null
  const normalized = unit.toLowerCase().trim()
  return UNIT_CONVERSIONS[normalized] || null
}

export function aggregateIngredients(ingredients: Ingredient[]): GroupedIngredients {
  // Group by ingredient name and unit
  const grouped: Record<string, AggregatedIngredient> = {}

  for (const ing of ingredients) {
    if (!ing.ingredient_name) continue

    const name = ing.ingredient_name.toLowerCase().trim()
    const normalized = normalizeUnit(ing.unit)
    const unit = normalized?.base || ing.unit || 'item'

    // Create unique key for aggregation
    const key = `${name}|${unit}`

    if (!grouped[key]) {
      grouped[key] = {
        name: ing.ingredient_name,
        totalQuantity: 0,
        unit: normalized?.base || ing.unit,
        category: ing.category || 'other',
        usedIn: []
      }
    }

    // Add quantity
    if (ing.quantity && normalized) {
      const convertedQty = ing.quantity * normalized.factor
      grouped[key].totalQuantity = (grouped[key].totalQuantity || 0) + convertedQty
    } else if (ing.quantity) {
      grouped[key].totalQuantity = (grouped[key].totalQuantity || 0) + ing.quantity
    }

    // Track which recipes use this ingredient
    if (!grouped[key].usedIn.includes(ing.recipe_name)) {
      grouped[key].usedIn.push(ing.recipe_name)
    }
  }

  // Group by category
  const result: GroupedIngredients = {}

  for (const agg of Object.values(grouped)) {
    const category = agg.category || 'other'
    if (!result[category]) {
      result[category] = []
    }
    result[category].push(agg)
  }

  // Sort each category alphabetically
  for (const category in result) {
    result[category].sort((a, b) => a.name.localeCompare(b.name))
  }

  return result
}

export function formatGroceryList(grouped: GroupedIngredients): string {
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

  let output = '# Grocery List\n\n'

  for (const category of categoryOrder) {
    const items = grouped[category]
    if (!items || items.length === 0) continue

    output += `## ${categoryNames[category] || category}\n\n`

    for (const item of items) {
      const quantity = item.totalQuantity
        ? `${formatQuantity(item.totalQuantity)} ${item.unit || ''} `
        : ''

      const usedIn = item.usedIn.length > 1
        ? ` (used in: ${item.usedIn.join(', ')})`
        : ` (${item.usedIn[0]})`

      output += `- ${quantity}${item.name}${usedIn}\n`
    }

    output += '\n'
  }

  return output
}

function formatQuantity(qty: number): string {
  // Round to 2 decimal places
  const rounded = Math.round(qty * 100) / 100

  // Convert to fraction if common fraction
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
