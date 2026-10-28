import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_QUESTION_LENGTH = 2000
const MAX_CONTEXT_DOCS = 5
const MAX_CONTENT_LENGTH = 1000

interface ContextDoc {
  title: string
  code: string
  type: string
  description?: string
  content?: string
}

function isValidDoc(doc: unknown): doc is ContextDoc {
  if (!doc || typeof doc !== 'object') return false
  const d = doc as Record<string, unknown>
  return typeof d.title === 'string' && typeof d.code === 'string' && typeof d.type === 'string'
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8)
  console.log(`[ask-groq:${requestId}] Function invoked`)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  const apiKeyHeader = req.headers.get('apikey')
  
  console.log(`[ask-groq:${requestId}] Headers check:`, {
    hasAuth: !!authHeader,
    hasApiKey: !!apiKeyHeader,
    authPrefix: authHeader?.substring(0, 20) || 'none'
  })
  
  if (!authHeader) {
    console.error(`[ask-groq:${requestId}] No Authorization header`)
    return new Response(
      JSON.stringify({ error: 'Unauthorized - No auth header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error(`[ask-groq:${requestId}] Auth verification failed:`, authError?.message || 'No user')
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  console.log(`[ask-groq:${requestId}] Authenticated user:`, user.email)

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      console.error(`[ask-groq:${requestId}] GROQ_API_KEY not configured`)
      return new Response(
        JSON.stringify({ error: 'AI service is not available' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const MAX_BODY_BYTES = 32_768 

    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let rawBody: string
    try {
      rawBody = await req.text()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to read request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { question, contextDocs } = body as { question: unknown; contextDocs: unknown }

    console.log(`[ask-groq:${requestId}] Request parsed:`, {
      questionLength: typeof question === 'string' ? question.length : 0,
      docsCount: Array.isArray(contextDocs) ? contextDocs.length : 0
    })

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid question' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Question exceeds ${MAX_QUESTION_LENGTH} character limit` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rawDocs = Array.isArray(contextDocs) ? contextDocs : []
    const safeDocs: ContextDoc[] = rawDocs
      .filter(isValidDoc)
      .slice(0, MAX_CONTEXT_DOCS)
      .map(doc => ({
        title: doc.title,
        code: doc.code,
        type: doc.type,
        description: typeof doc.description === 'string' ? doc.description : '',
        content: typeof doc.content === 'string' ? doc.content.slice(0, MAX_CONTENT_LENGTH) : '',
      }))

    if (safeDocs.length === 0) {
      console.log(`[ask-groq:${requestId}] No documents found, returning generic response`)
      return new Response(
        JSON.stringify({
          answer: "I couldn't find any relevant documents in the OpsMind knowledge base for your question. Please make sure the relevant SOPs, technical guides, or operational cases have been added to OpsMind, then try again.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[ask-groq:${requestId}] Calling Groq API with ${safeDocs.length} documents`)

    const systemPrompt = `You are OpsMind AI, a helpful assistant for a Technical Support Knowledge Management System. You help employees find information from stored SOPs, technical documents, and operational cases.`

    const userPrompt = `The user asked: "${question}"

Here are the relevant documents found in the knowledge base:

${safeDocs.map(doc =>
  `Title: ${doc.title} (${doc.code})\nType: ${doc.type}\nDescription: ${doc.description || 'N/A'}\nContent: ${doc.content}`
).join('\n\n---\n\n')}

Answer the user's question using these documents as your primary source. Reference specific document titles when relevant. Be clear, helpful, and concise.`

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!groqResponse.ok) {
      const err = await groqResponse.json()
      console.error(`[ask-groq:${requestId}] Groq API error:`, {
        status: groqResponse.status,
        error: err?.error?.message || 'Unknown'
      })
      return new Response(
        JSON.stringify({ error: err?.error?.message || 'Groq API error' }),
        { status: groqResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await groqResponse.json()
    const answer = data.choices?.[0]?.message?.content || 'No response generated.'

    console.log(`[ask-groq:${requestId}] Success, returning answer (${answer.length} chars)`)

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(`[ask-groq:${requestId}] Unexpected error:`, (err as Error).message)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
