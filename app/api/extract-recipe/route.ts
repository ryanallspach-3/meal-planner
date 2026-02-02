import { NextRequest, NextResponse } from 'next/server'
import { scrapeRecipeFromUrl } from '@/lib/extractors/web-scraper'
import { parsePdfRecipe } from '@/lib/extractors/pdf-parser'
import { parseDocxRecipe } from '@/lib/extractors/docx-parser'

// POST /api/extract-recipe - Extract recipe from URL or file
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle URL extraction
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { url } = body

      if (!url) {
        return NextResponse.json(
          { error: 'Missing URL' },
          { status: 400 }
        )
      }

      const recipe = await scrapeRecipeFromUrl(url)
      return NextResponse.json({ recipe })
    }

    // Handle file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json(
          { error: 'Missing file' },
          { status: 400 }
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name
      const mimeType = file.type

      let recipe

      if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
        recipe = await parsePdfRecipe(buffer, fileName)
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.match(/\.docx?$/i)
      ) {
        recipe = await parseDocxRecipe(buffer, fileName)
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
          { status: 400 }
        )
      }

      return NextResponse.json({ recipe })
    }

    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to extract recipe:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract recipe' },
      { status: 500 }
    )
  }
}
