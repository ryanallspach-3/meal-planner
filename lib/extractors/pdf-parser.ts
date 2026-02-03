export type ParsedPdfRecipe = {
  name: string
  ingredients: string[]
  fullText: string
}

export async function parsePdfRecipe(buffer: Buffer, fileName: string): Promise<ParsedPdfRecipe> {
  try {
    // Dynamic import to avoid build-time issues
    // Import lib path directly — the main entry point tries to open a test file at build time
    // @ts-ignore - no declarations for the lib subpath
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
    const data = await pdfParse(buffer)
    const text: string = data.text

    // Try to extract recipe name from filename or first line
    let name = fileName.replace(/\.pdf$/i, '').trim()

    // Look for title patterns in the text
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length > 0) {
      // Often the first non-empty line is the title
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
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      // End when we hit common section headers
      if (line.match(/^(instructions?|directions?|steps?|method|preparation):?$/i)) {
        ingredientEndIndex = i
        break
      }
    }
  }

  if (ingredientStartIndex === -1) {
    // No clear ingredients section found, try to extract lines that look like ingredients
    return extractIngredientLikeLines(lines)
  }

  const endIndex = ingredientEndIndex > -1 ? ingredientEndIndex : lines.length
  const ingredientLines = lines.slice(ingredientStartIndex, endIndex)

  return ingredientLines
    .filter(line => {
      // Filter out empty lines and section headers
      if (line.length === 0) return false
      if (line.match(/^(for the|optional|garnish):?$/i)) return false
      return true
    })
    .filter(line => line.length > 2 && line.length < 200)
}

function extractIngredientLikeLines(lines: string[]): string[] {
  // Look for lines that start with quantities or common ingredient patterns
  const ingredientPattern = /^(\d+\/?\d*\s+)?(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g\b|ml|cloves?|cans?|packages?|pinch|dash)?\s*[a-z]/i

  return lines
    .filter(line => {
      if (line.length < 3 || line.length > 200) return false
      return ingredientPattern.test(line)
    })
    .slice(0, 30) // Limit to first 30 ingredient-like lines
}
