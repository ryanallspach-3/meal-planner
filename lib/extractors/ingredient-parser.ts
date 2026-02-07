// Ingredient text parser - converts "2 cups flour" to structured data

type ParsedIngredient = {
  quantity: number | null
  unit: string | null
  ingredient_name: string | null
  category: string | null
}

// Common units (longer ones first to match "tablespoon" before "table")
const UNITS = [
  'tablespoons', 'tablespoon', 'teaspoons', 'teaspoon',
  'tbsp', 'tsp', 'T', 't',
  'cups', 'cup', 'c',
  'ounces', 'ounce', 'oz',
  'pounds', 'pound', 'lbs', 'lb',
  'grams', 'gram', 'g',
  'kilograms', 'kilogram', 'kg',
  'milliliters', 'milliliter', 'ml',
  'liters', 'liter', 'l',
  'quarts', 'quart', 'qt',
  'pints', 'pint', 'pt',
  'gallons', 'gallon', 'gal',
  'pinch', 'pinches', 'dash', 'dashes',
  'cloves', 'clove',
  'cans', 'can',
  'packages', 'package', 'pkg',
  'bags', 'bag',
  'jars', 'jar',
  'bottles', 'bottle',
  'slices', 'slice',
  'pieces', 'piece',
  'stalks', 'stalk',
  'sprigs', 'sprig',
  'bunches', 'bunch',
  'heads', 'head',
  'whole',
]

// Normalize units to standard abbreviations
const UNIT_DISPLAY: Record<string, string> = {
  'teaspoon': 'tsp', 'teaspoons': 'tsp', 't': 'tsp',
  'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'T': 'tbsp',
  'pound': 'lb', 'pounds': 'lb', 'lbs': 'lb',
  'ounce': 'oz', 'ounces': 'oz',
  'cup': 'cup', 'cups': 'cup', 'c': 'cup',
  'gram': 'g', 'grams': 'g',
  'kilogram': 'kg', 'kilograms': 'kg',
  'milliliter': 'ml', 'milliliters': 'ml',
  'liter': 'L', 'liters': 'L', 'l': 'L',
  'quart': 'qt', 'quarts': 'qt',
  'pint': 'pt', 'pints': 'pt',
  'gallon': 'gal', 'gallons': 'gal',
  'clove': 'clove', 'cloves': 'clove',
  'can': 'can', 'cans': 'can',
  'package': 'pkg', 'packages': 'pkg', 'pkg': 'pkg',
  'slice': 'slice', 'slices': 'slice',
  'piece': 'piece', 'pieces': 'piece',
  'stalk': 'stalk', 'stalks': 'stalk',
  'sprig': 'sprig', 'sprigs': 'sprig',
  'bunch': 'bunch', 'bunches': 'bunch',
  'head': 'head', 'heads': 'head',
  'bag': 'bag', 'bags': 'bag',
  'jar': 'jar', 'jars': 'jar',
  'bottle': 'bottle', 'bottles': 'bottle',
  'pinch': 'pinch', 'pinches': 'pinch',
  'dash': 'dash', 'dashes': 'dash',
  'whole': 'whole',
}

function normalizeUnit(unit: string): string {
  return UNIT_DISPLAY[unit.toLowerCase()] || unit.toLowerCase()
}

// Unicode fractions to decimal
const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 0.167, '⅚': 0.833, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

// Word numbers to numeric values
const WORD_NUMBERS: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12,
  'a': 1, 'an': 1, 'half': 0.5, 'quarter': 0.25,
}

// Ingredient categories
const CATEGORIES: Record<string, string[]> = {
  produce: [
    'tomato', 'onion', 'garlic', 'carrot', 'celery', 'potato', 'lettuce', 'spinach',
    'broccoli', 'cauliflower', 'pepper', 'bell pepper', 'jalapeño', 'jalapeno', 'cucumber', 'zucchini',
    'squash', 'mushroom', 'corn', 'peas', 'green beans', 'cabbage', 'kale', 'arugula',
    'avocado', 'lime', 'lemon', 'orange', 'apple', 'banana', 'berry', 'strawberry',
    'blueberry', 'raspberry', 'cilantro', 'parsley', 'basil', 'thyme', 'rosemary', 'oregano',
    'ginger', 'scallion', 'shallot', 'chive', 'leek', 'asparagus', 'artichoke', 'eggplant',
    'radish', 'turnip', 'beet', 'fennel', 'bok choy', 'watercress', 'endive', 'radicchio'
  ],
  meat: [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'sausage', 'bacon', 'ham', 'ground beef',
    'ground turkey', 'ground pork', 'steak', 'roast', 'chop', 'breast', 'thigh', 'wing',
    'ribs', 'tenderloin', 'brisket', 'meatball', 'veal', 'duck', 'goose', 'venison'
  ],
  seafood: [
    'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'prawns', 'crab', 'lobster',
    'scallop', 'mussel', 'clam', 'oyster', 'anchovy', 'sardine', 'halibut', 'trout',
    'bass', 'mahi', 'swordfish', 'calamari', 'squid', 'octopus'
  ],
  dairy: [
    'milk', 'cream', 'heavy cream', 'sour cream', 'yogurt', 'cheese', 'cheddar', 'mozzarella',
    'parmesan', 'butter', 'eggs', 'egg', 'cream cheese', 'cottage cheese', 'ricotta',
    'feta', 'gouda', 'brie', 'gruyere', 'swiss', 'provolone', 'mascarpone', 'half-and-half',
    'buttermilk', 'whipped cream', 'ghee'
  ],
  pantry: [
    'flour', 'sugar', 'brown sugar', 'rice', 'pasta', 'noodles', 'bread', 'tortilla',
    'oil', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'coconut oil',
    'vinegar', 'soy sauce', 'worcestershire', 'fish sauce', 'oyster sauce', 'hoisin',
    'ketchup', 'mustard', 'mayo', 'mayonnaise', 'honey', 'maple syrup', 'peanut butter',
    'almond butter', 'jam', 'jelly', 'oats', 'cereal', 'crackers', 'chips',
    'beans', 'black beans', 'kidney beans', 'chickpeas', 'lentils', 'quinoa', 'couscous',
    'breadcrumbs', 'panko', 'cornmeal', 'polenta'
  ],
  spices: [
    'salt', 'pepper', 'black pepper', 'white pepper', 'garlic powder', 'onion powder',
    'paprika', 'smoked paprika', 'cayenne', 'cumin', 'coriander', 'cinnamon', 'nutmeg',
    'vanilla', 'chili powder', 'red pepper flakes', 'italian seasoning', 'bay leaf',
    'curry powder', 'turmeric', 'garam masala', 'oregano', 'thyme', 'rosemary', 'sage',
    'dill', 'tarragon', 'marjoram', 'allspice', 'cloves', 'cardamom', 'star anise',
    'fennel seed', 'mustard seed', 'celery seed', 'caraway', 'saffron'
  ],
  canned: [
    'tomato sauce', 'tomato paste', 'diced tomatoes', 'crushed tomatoes', 'broth',
    'stock', 'chicken broth', 'beef broth', 'vegetable broth', 'coconut milk',
    'condensed milk', 'evaporated milk', 'tomatoes', 'artichoke hearts', 'olives',
    'capers', 'anchovies', 'tuna', 'salmon', 'beans', 'corn', 'peas'
  ],
  frozen: [
    'frozen', 'ice cream', 'frozen vegetables', 'frozen fruit', 'frozen peas',
    'frozen corn', 'frozen spinach', 'frozen berries', 'ice'
  ],
  beverages: [
    'water', 'wine', 'red wine', 'white wine', 'beer', 'coffee', 'espresso',
    'tea', 'juice', 'orange juice', 'lemon juice', 'lime juice', 'soda', 'club soda',
    'tonic', 'sparkling water', 'broth', 'stock'
  ],
  baking: [
    'baking powder', 'baking soda', 'yeast', 'cornstarch', 'cocoa powder', 'chocolate chips',
    'vanilla extract', 'almond extract', 'lemon extract', 'food coloring', 'gelatin',
    'powdered sugar', 'confectioners sugar', 'corn syrup', 'molasses', 'shortening',
    'cream of tartar', 'meringue powder', 'sprinkles'
  ]
}

// Build regex pattern for units (escape special chars, sort by length desc)
const UNIT_PATTERN = UNITS
  .sort((a, b) => b.length - a.length)
  .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

// Pattern to match quantity with optional unit
// Matches: "2", "2.5", "1/2", "1 1/2", "2-3", "½", "1½", word numbers
// Followed optionally by a unit
const QUANTITY_UNIT_REGEX = new RegExp(
  `(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\.\\d+|\\d+-\\d+|\\d+)?` + // numeric quantity (optional)
  `\\s*` +
  `([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])?` + // unicode fraction (optional)
  `\\s*` +
  `(${UNIT_PATTERN})?` + // unit (optional)
  `\\b`,
  'gi'
)

export function parseIngredient(text: string): ParsedIngredient {
  let workingText = text.trim()

  // Convert word numbers anywhere in text
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    workingText = workingText.replace(regex, String(num))
  }

  let quantity: number | null = null
  let unit: string | null = null
  let matchedText = ''

  // Find all quantity/unit patterns and take the first complete one
  const matches: Array<{
    fullMatch: string
    index: number
    qty: number | null
    unit: string | null
  }> = []

  // Reset regex
  QUANTITY_UNIT_REGEX.lastIndex = 0

  let match
  while ((match = QUANTITY_UNIT_REGEX.exec(workingText)) !== null) {
    const [fullMatch, numericPart, unicodeFrac, unitPart] = match

    // Skip empty matches
    if (!fullMatch.trim()) continue

    // Skip if no quantity AND no unit found
    if (!numericPart && !unicodeFrac && !unitPart) continue

    let qty: number | null = null

    // Parse numeric part
    if (numericPart) {
      const numStr = numericPart.trim()
      if (numStr.includes('/')) {
        // Handle fractions like "1/2" or "1 1/2"
        const parts = numStr.split(/\s+/)
        let total = 0
        for (const part of parts) {
          if (part.includes('/')) {
            const [num, den] = part.split('/').map(Number)
            if (!isNaN(num) && !isNaN(den) && den !== 0) {
              total += num / den
            }
          } else {
            const n = Number(part)
            if (!isNaN(n)) total += n
          }
        }
        qty = total || null
      } else if (numStr.includes('-')) {
        // Range like "2-3" - take average
        const [min, max] = numStr.split('-').map(Number)
        if (!isNaN(min) && !isNaN(max)) {
          qty = (min + max) / 2
        }
      } else {
        const n = parseFloat(numStr)
        if (!isNaN(n)) qty = n
      }
    }

    // Add unicode fraction
    if (unicodeFrac && UNICODE_FRACTIONS[unicodeFrac]) {
      qty = (qty || 0) + UNICODE_FRACTIONS[unicodeFrac]
    }

    matches.push({
      fullMatch,
      index: match.index,
      qty,
      unit: unitPart ? normalizeUnit(unitPart) : null
    })
  }

  // Prefer matches that have both quantity and unit
  // Then prefer matches at the start of the string
  // Then prefer matches with quantity
  matches.sort((a, b) => {
    const aScore = (a.qty !== null ? 2 : 0) + (a.unit !== null ? 1 : 0)
    const bScore = (b.qty !== null ? 2 : 0) + (b.unit !== null ? 1 : 0)
    if (aScore !== bScore) return bScore - aScore
    return a.index - b.index
  })

  if (matches.length > 0) {
    const best = matches[0]
    quantity = best.qty
    unit = best.unit
    matchedText = best.fullMatch
  }

  // Also check for standalone numbers at the start that might have been missed
  if (quantity === null) {
    const startNumMatch = workingText.match(/^(\d+\.?\d*)\s+/)
    if (startNumMatch) {
      quantity = parseFloat(startNumMatch[1])
      matchedText = startNumMatch[0]
    }
  }

  // Remove the matched quantity/unit from the text to get ingredient name
  let ingredientName = workingText

  if (matchedText) {
    // Remove the matched text
    ingredientName = ingredientName.replace(matchedText, ' ')
  }

  // Also remove any remaining quantity/unit patterns from the ingredient name
  // This catches cases like "flour (2 cups)" -> "flour"
  ingredientName = ingredientName
    // Remove parenthetical quantities like "(2 cups)" or "(about 1 lb)"
    .replace(/\s*\([^)]*\d[^)]*\)/g, '')
    // Remove trailing quantities like ", 2 cups"
    .replace(/,\s*\d[\d\s\/.-]*\s*(${UNIT_PATTERN})?\s*$/gi, '')
    // Remove any remaining standalone numbers with units
    .replace(new RegExp(`\\b\\d+[\\d\\s\\/.,-]*\\s*(${UNIT_PATTERN})\\b`, 'gi'), '')
    // Remove unicode fractions
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, '')
    // Clean up common prefixes/suffixes
    .replace(/^of\s+/i, '')
    .replace(/^(full|whole|large|medium|small|fresh|dried|frozen|canned)\s+/gi, '')
    .replace(/,?\s*(chopped|diced|minced|sliced|grated|shredded|julienned|cubed|crushed|melted|softened|room temperature|at room temp|divided|packed|sifted|toasted|roasted|peeled|seeded|deveined|trimmed|rinsed|drained|optional).*$/gi, '')
    // Clean up extra whitespace and punctuation
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim()

  // If we stripped everything, fall back to a cleaned version of original
  if (!ingredientName) {
    ingredientName = text
      .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, '')
      .replace(/\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim() || text.trim()
  }

  // Categorize
  const category = categorizeIngredient(ingredientName)

  return {
    quantity,
    unit,
    ingredient_name: ingredientName || null,
    category
  }
}

function categorizeIngredient(name: string): string | null {
  const normalized = name.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category
      }
    }
  }

  // Default to pantry for uncategorized items
  return 'pantry'
}

export function parseIngredientList(ingredients: string[]): ParsedIngredient[] {
  return ingredients.map(parseIngredient)
}
