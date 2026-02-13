import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1/crawl'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { agent_id, domains } = await req.json()

    if (!agent_id || !domains || domains.length === 0) {
      return NextResponse.json({ error: 'Missing agent_id or domains' }, { status: 400 })
    }

    const allResults: any[] = []

    for (const domain of domains) {
      // Handle wildcard logic
      const deepCrawl = domain.includes('*')
      const baseUrl = domain.replace('*', '').trim()

      console.log(`[crawl] Crawling ${baseUrl} | deep=${deepCrawl}`)

      const firecrawlResp = await fetch(FIRECRAWL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url: baseUrl,
          maxDepth: deepCrawl ? 5 : 1,  // crawl sub-paths when wildcard present
          limit: deepCrawl ? 200 : 20,  // limit number of pages
        }),
      })

      const data = await firecrawlResp.json()
      const pages = data.pages || []

      // Store raw crawl result
      await supabase.from('training_data').insert([
        {
          agent_id,
          example_type: 'website_crawl',
          example_text: JSON.stringify({ baseUrl, deepCrawl, pages }),
        },
      ])

      allResults.push({ domain: baseUrl, pages: pages.length })
    }

    return NextResponse.json({
      message: 'Crawl completed successfully',
      summary: allResults,
    })
  } catch (err: any) {
    console.error('[crawl] error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}