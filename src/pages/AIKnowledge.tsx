import { useState, useEffect, useRef } from 'react'
import { searchDocuments } from '../services/documents'
import {
  Sparkles,
  Send,
  FileText,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Search,
  ChevronRight,
} from 'lucide-react'

// Search with multiple strategies to maximize recall
async function smartSearch(query: string) {
  const results: any[] = []
  const seen = new Set<string>()

  const addUnique = (docs: any[]) => {
    for (const doc of docs) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id)
        results.push(doc)
      }
    }
  }

  // Strategy 1: full phrase search
  try {
    const r = await searchDocuments(query)
    addUnique(r)
  } catch {}

  // Strategy 2: search each meaningful word separately
  const words = query
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2)

  for (const word of words) {
    try {
      const r = await searchDocuments(word)
      addUnique(r)
    } catch {}
  }

  return results.slice(0, 5)
}

interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: string
  sources?: Array<{
    id: string
    title: string
    code: string
    type: string
  }>
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

async function askGemini(question: string, contextDocs: any[]): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured')

  const hasContext = contextDocs.length > 0

  const context = hasContext
    ? contextDocs
        .map(doc =>
          `Title: ${doc.title} (${doc.code})\nType: ${doc.type}\nDescription: ${doc.description || 'N/A'}\nContent: ${(doc.content || '').slice(0, 1000)}`
        )
        .join('\n\n---\n\n')
    : ''

  const prompt = hasContext
    ? `You are OpsMind AI, a helpful assistant for a Technical Support Knowledge Management System.

The user asked: "${question}"

I found these relevant documents in the knowledge base:

${context}

Instructions:
- Answer the user's question in a clear, helpful and friendly way
- Use the documents above as your primary source
- Reference specific document titles when relevant
- If the documents fully answer the question, base your answer on them
- If the documents are only partially relevant, use them plus your general knowledge
- Be conversational and helpful like a knowledgeable colleague`
    : `You are OpsMind AI, a helpful assistant for a Technical Support Knowledge Management System called OpsMind.

The user asked: "${question}"

No specific documents were found in the knowledge base for this query.

Instructions:
- Answer helpfully and conversationally using your general knowledge
- If it's a greeting or general question, respond naturally and friendly
- If it's a technical question related to IT support, answer from your general knowledge and suggest the user add relevant documents to OpsMind
- Keep responses concise and clear`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let response: Response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message || 'Gemini API error')
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.'
}

export function AIKnowledge() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI knowledge assistant powered by Google Gemini. Ask me anything about SOPs, technical documents, or operational cases stored in OpsMind.",
      timestamp: 'Just now',
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!query.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMessage])
    const currentQuery = query
    setQuery('')
    setIsProcessing(true)

    try {
      // Search the knowledge base for relevant docs
      const relevantDocs = await smartSearch(currentQuery)

      // Always call Gemini — pass docs as context if found, otherwise let it answer generally
      const aiContent = await askGemini(currentQuery, relevantDocs)

      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: relevantDocs.length > 0 ? relevantDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          code: doc.code,
          type: doc.type,
        })) : undefined,
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      const errMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Sorry, I encountered an error: ${(err as Error).message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, errMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const suggestedQuestions = [
    "How do I troubleshoot a POS that won't power on?",
    'What are the steps for receipt printer setup?',
    'How do I configure a barcode scanner?',
    'What is the SOP for device replacement?',
  ]

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Knowledge Assistant
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ask questions and get AI-assisted answers from the knowledge base
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">Gemini AI</span>
        </div>
      </div>

      {/* info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-1">How it works</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            I search through stored documents (SOPs, technical guides, operational cases) and use Google Gemini to generate contextual answers based on the retrieved content. I only use information already in OpsMind.
          </p>
        </div>
      </div>

      {/* chat */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[82%] ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'} rounded-2xl p-4`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-[10px] mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {message.timestamp}
                </p>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-[11px] font-semibold mb-2 text-slate-600 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Sources used:
                    </p>
                    <div className="space-y-1.5">
                      {message.sources.map((source, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="font-medium truncate">{source.title}</span>
                          <span className="text-slate-400 flex-shrink-0">{source.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  <span className="text-xs text-slate-500 ml-1">Searching & generating answer...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about SOPs, technical documents, or operational cases..."
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-all"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!query.trim() || isProcessing}
              className="flex items-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              Ask
            </button>
          </div>
        </div>
      </div>

      {/* suggested questions */}
      {messages.length <= 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Suggested Questions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => setQuery(question)}
                className="flex items-start gap-2 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                  <Search className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{question}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-900 mb-1">AI Limitations</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            AI answers are based solely on documents stored in OpsMind. Always verify critical information with official SOPs and consult supervisors for important decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
