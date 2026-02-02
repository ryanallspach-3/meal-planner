// Ingredient text parser - converts "2 cups flour" to structured data

type ParsedIngredient = {
  quantity: number | null
  unit: string | null
  ingredient_name: string | null
  category: string | null
}

// Common units
const UNITS = [
  'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp',
  'ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg', 'milliliter', 'milliliters', 'ml', 'liter', 'liters', 'l',
  'pinch', 'dash', 'clove', 'cloves', 'can', 'cans', 'package', 'packages', 'bag', 'bags',
  'jar', 'jars', 'bottle', 'bottles', 'slice', 'slices', 'piece', 'pieces', 'whole'
]

// Ingredient categories
const CATEGORIES: Record<string, string[]> = {
  produce: [
    'tomato', 'onion', 'garlic', 'carrot', 'celery', 'potato', 'lettuce', 'spinach',
    'broccoli', 'cauliflower', 'pepper', 'bell pepper', 'jalapeño', 'cucumber', 'zucchini',
    'squash', 'mushroom', 'corn', 'peas', 'green beans', 'cabbage', 'kale', 'arugula',
    'avocado', 'lime', 'lemon', 'orange', 'apple', 'banana', 'berry', 'strawberry',
    'blueberry', 'raspberry', 'cilantro', 'parsley', 'basil', 'thyme', 'rosemary', 'oregano',
    'ginger', 'scallion', 'shallot', 'chive'
  ],
  meat: [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'sausage', 'bacon', 'ham', 'ground beef',
    'ground turkey', 'ground pork', 'steak', 'roast', 'chop', 'breast', 'thigh', 'wing'
  ],
  seafood: [
    'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'prawns', 'crab', 'lobster',
    'scallop', 'mussel', 'clam', 'oyster'
  ],
  dairy: [
    'milk', 'cream', 'heavy cream', 'sour cream', 'yogurt', 'cheese', 'cheddar', 'mozzarella',
    'parmesan', 'butter', 'eggs', 'egg', 'cream cheese', 'cottage cheese', 'ricotta'
  ],
  pantry: [
    'flour', 'sugar', 'brown sugar', 'rice', 'pasta', 'noodles', 'bread', 'tortilla',
    'oil', 'olive oil', 'vegetable oil', 'vinegar', 'soy sauce', 'worcestershire',
    'ketchup', 'mustard', 'mayo', 'mayonnaise', 'honey', 'maple syrup', 'peanut butter',
    'jam', 'jelly', 'oats', 'cereal', 'crackers', 'chips', 'beans', 'black beans',
    'kidney beans', 'chickpeas', 'lentils', 'quinoa', 'couscous'
  ],
  spices: [
    'salt', 'pepper', 'black pepper', 'garlic powder', 'onion powder', 'paprika',
    'cayenne', 'cumin', 'coriander', 'cinnamon', 'nutmeg', 'vanilla', 'chili powder',
    'red pepper flakes', 'italian seasoning', 'bay leaf', 'curry powder'
  ],
  canned: [
    'tomato sauce', 'tomato paste', 'diced tomatoes', 'crushed tomatoes', 'broth',
    'stock', 'chicken broth', 'beef broth', 'vegetable broth', 'coconut milk'
  ],
  frozen: [
    'frozen', 'ice cream', 'frozen vegetables', 'frozen fruit'
  ],
  beverages: [
    'water', 'wine', 'beer', 'coffee', 'tea', 'juice', 'soda'
  ],
  baking: [
    'baking powder', 'baking soda', 'yeast', 'cornstarch', 'cocoa powder', 'chocolate chips',
    'vanilla extract', 'almond extract'
  ]
}

export function parseIngredient(text: string): ParsedIngredient {
  const normalized = text.toLowerCase().trim()

  // Extract quantity (supports fractions like 1/2, 1 1/2, decimals, ranges like 2-3)
  const quantityMatch = normalized.match(/^(\d+\/\d+|\d+\s+\d+\/\d+|\d+\.?\d*|\d+-\d+)\s+/)
  let quantity: number | null = null
  let remainingText = normalized

  if (quantityMatch) {
    const qtyStr = quantityMatch[1]
    remainingText = normalized.slice(quantityMatch[0].length)

    // Handle fractions
    if (qtyStr.includes('/')) {
      const parts = qtyStr.split(/\s+/)
      let total = 0
      for (const part of parts) {
        if (part.includes('/')) {
          const [num, den] = part.split('/').map(Number)
          total += num / den
        } else {
          total += Number(part)
        }
      }
      quantity = total
    } else if (qtyStr.includes('-')) {
      // For ranges, take the average
      const [min, max] = qtyStr.split('-').map(Number)
      quantity = (min + max) / 2
    } else {
      quantity = parseFloat(qtyStr)
    }
  }

  // Extract unit
  let unit: string | null = null
  for (const u of UNITS) {
    const regex = new RegExp(`^${u}\\b`, 'i')
    if (regex.test(remainingText)) {
      unit = u
      remainingText = remainingText.slice(u.length).trim()
      break
    }
  }

  // Remaining text is the ingredient name (clean up common words)
  let ingredientName = remainingText
    .replace(/^of\s+/, '')
    .replace(/,?\s*(chopped|diced|minced|sliced|grated|shredded|fresh|dried|frozen|canned|cooked|raw|boneless|skinless).*$/i, '')
    .trim()

  if (!ingredientName) {
    ingredientName = normalized
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
