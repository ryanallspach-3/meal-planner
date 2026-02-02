import mammoth from 'mammoth'

export type ParsedDocxRecipe = {
  name: string
  ingredients: string[]
  fullText: string
}

export async function parseDocxRecipe(buffer: Buffer, fileName: string): Promise<ParsedDocxRecipe> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    // Try to extract recipe name from filename or first line
    let name = fileName.replace(/\.docx?$/i, '').trim()

    // Look for title patterns in the text
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length > 0) {
      const firstLine = lines[0]
      if (firstLine.length < 100 && !firstLine.match(/^\d/)) {
        name = firstLine
      }
    }

    // Extract ingredients section
    const ingredients = extractIngredientsFromText(text)

    return {
      name,
      ingredients,
      fullText: text
    }
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function extractIngredientsFromText(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim())

  // Look for "Ingredients" section
  let ingredientStartIndex = -1
  let ingredientEndIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()

    if (line.match(/^ingredients?:?$/i) || line.match(/^what you need:?$/i)) {
      ingredientStartIndex = i + 1
    }

    if (ingredientStartIndex > -1 && ingredientEndIndex === -1) {
      if (line.match(/^(instructions?|directions?|steps?|method|preparation):?$/i)) {
        ingredientEndIndex = i
        break
      }
    }
  }

  if (ingredientStartIndex === -1) {
    return extractIngredientLikeLines(lines)
  }

  const endIndex = ingredientEndIndex > -1 ? ingredientEndIndex : lines.length
  const ingredientLines = lines.slice(ingredientStartIndex, endIndex)

  return ingredientLines
    .filter(line => {
      if (line.length === 0) return false
      if (line.match(/^(for the|optional|garnish):?$/i)) return false
      return true
    })
    .filter(line => line.length > 2 && line.length < 200)
}

function extractIngredientLikeLines(lines: string[]): string[] {
  const ingredientPattern = /^(\d+\/?\d*\s+)?(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g\b|ml|cloves?|cans?|packages?|pinch|dash)?\s*[a-z]/i

  return lines
    .filter(line => {
      if (line.length < 3 || line.length > 200) return false
      return ingredientPattern.test(line)
    })
    .slice(0, 30)
}
