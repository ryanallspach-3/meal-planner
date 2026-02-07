type Ingredient = {
  quantity: number | null
  unit: string | null
  ingredient_name: string | null
  category: string | null
  recipe_name: string
}

type QuantityGroup = {
  amount: number
  unit: string
}

type AggregatedIngredient = {
  name: string
  quantities: QuantityGroup[]
  category: string
  usedIn: string[]
}

type GroupedIngredients = {
  [category: string]: AggregatedIngredient[]
}

// Unit normalization (singularize and standardize)
const UNIT_NORMALIZATIONS: Record<string, string> = {
  'cups': 'cup',
  'tablespoons': 'tablespoon',
  'tbsp': 'tablespoon',
  'teaspoons': 'teaspoon',
  'tsp': 'teaspoon',
  'ounces': 'ounce',
  'oz': 'ounce',
  'pounds': 'pound',
  'lbs': 'pound',
  'lb': 'pound',
  'grams': 'gram',
  'g': 'gram',
  'cloves': 'clove',
  'cans': 'can',
  'packages': 'package',
  'slices': 'slice',
  'pieces': 'piece',
}

function normalizeUnit(unit: string | null): string {
  if (!unit) return 'item'
  const lower = unit.toLowerCase().trim()
  return UNIT_NORMALIZATIONS[lower] || lower
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim()
}

export function aggregateIngredients(ingredients: Ingredient[]): GroupedIngredients {
  // Group by base ingredient name (regardless of unit)
  const byName: Record<string, {
    displayName: string
    category: string
    usedIn: Set<string>
    byUnit: Record<string, number>
  }> = {}

  for (const ing of ingredients) {
    if (!ing.ingredient_name) continue

    const key = normalizeIngredientName(ing.ingredient_name)
    const unit = normalizeUnit(ing.unit)

    if (!byName[key]) {
      byName[key] = {
        displayName: ing.ingredient_name,
        category: ing.category || 'other',
        usedIn: new Set(),
        byUnit: {}
      }
    }

    // Sum quantities for this unit
    if (ing.quantity) {
      byName[key].byUnit[unit] = (byName[key].byUnit[unit] || 0) + ing.quantity
    } else if (!byName[key].byUnit[unit]) {
      // Track unit even without quantity
      byName[key].byUnit[unit] = 0
    }

    byName[key].usedIn.add(ing.recipe_name)
  }

  // Convert to grouped structure
  const result: GroupedIngredients = {}

  for (const [, data] of Object.entries(byName)) {
    const category = data.category
    if (!result[category]) {
      result[category] = []
    }

    // Convert byUnit map to quantities array
    const quantities: QuantityGroup[] = []
    for (const [unit, amount] of Object.entries(data.byUnit)) {
      if (amount > 0) {
        quantities.push({ amount, unit })
      }
    }

    result[category].push({
      name: data.displayName,
      quantities,
      category,
      usedIn: Array.from(data.usedIn)
    })
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
      const quantityStr = formatQuantities(item.quantities)
      const usedIn = item.usedIn.length > 1
        ? ` (used in: ${item.usedIn.join(', ')})`
        : ` (${item.usedIn[0]})`

      if (quantityStr) {
        output += `- ${item.name} — ${quantityStr}${usedIn}\n`
      } else {
        output += `- ${item.name}${usedIn}\n`
      }
    }

    output += '\n'
  }

  return output
}

function formatQuantities(quantities: QuantityGroup[]): string {
  if (quantities.length === 0) return ''

  return quantities
    .map(q => `${formatQuantity(q.amount)} ${q.unit}`)
    .join(', ')
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
