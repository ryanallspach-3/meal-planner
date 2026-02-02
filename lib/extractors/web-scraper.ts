import * as cheerio from 'cheerio'

export type ScrapedRecipe = {
  name: string
  ingredients: string[]
  servings?: number
}

export async function scrapeRecipeFromUrl(url: string): Promise<ScrapedRecipe> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Try to extract from schema.org Recipe structured data (JSON-LD)
    const schemaRecipe = extractFromSchema($)
    if (schemaRecipe) {
      return schemaRecipe
    }

    // Fallback to common CSS selectors
    return extractFromHtml($, url)
  } catch (error) {
    throw new Error(`Failed to scrape recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function extractFromSchema($: cheerio.CheerioAPI): ScrapedRecipe | null {
  try {
    // Look for JSON-LD schema.org Recipe data
    const scripts = $('script[type="application/ld+json"]')

    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = $(scripts[i]).html()
      if (!scriptContent) continue

      try {
        const data = JSON.parse(scriptContent)

        // Handle both single objects and arrays
        const recipes = Array.isArray(data) ? data : [data]

        for (const item of recipes) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            const ingredients = Array.isArray(item.recipeIngredient)
              ? item.recipeIngredient
              : []

            if (item.name && ingredients.length > 0) {
              return {
                name: item.name,
                ingredients,
                servings: item.recipeYield ? parseInt(String(item.recipeYield)) : undefined
              }
            }
          }
        }
      } catch (parseError) {
        // Continue to next script tag
        continue
      }
    }
  } catch (error) {
    // Fall through to HTML extraction
  }

  return null
}

function extractFromHtml($: cheerio.CheerioAPI, url: string): ScrapedRecipe {
  // Try to find recipe name
  let name = $('h1.recipe-title, h1[class*="recipe"], h1[class*="title"], h1').first().text().trim()

  if (!name) {
    // Use page title as fallback
    name = $('title').text().trim()
  }

  // Common ingredient selectors
  const ingredientSelectors = [
    '.recipe-ingredients li',
    '.ingredients li',
    '[class*="ingredient"] li',
    'ul[class*="ingredient"] li',
    '.recipe-ingredient',
    '[itemprop="recipeIngredient"]',
    '[class*="ingredient-list"] li'
  ]

  let ingredients: string[] = []

  for (const selector of ingredientSelectors) {
    const items = $(selector)
    if (items.length > 0) {
      ingredients = items.map((_, el) => $(el).text().trim()).get()
      break
    }
  }

  // Clean up ingredients
  ingredients = ingredients
    .filter(ing => ing.length > 0 && ing.length < 200) // Filter out empty or suspiciously long items
    .map(ing => ing.replace(/\s+/g, ' ').trim())

  if (!name || ingredients.length === 0) {
    throw new Error('Could not extract recipe name or ingredients from the page')
  }

  return { name, ingredients }
}
