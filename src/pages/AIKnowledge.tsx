import { useState } from 'react'
import { mockDocuments } from '../data/documents'
import {
  Sparkles,
  Send,
  FileText,
  AlertCircle,
  Clock,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Search,
} from 'lucide-react'

interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: string
  sources?: Array<{
    id: number
    title: string
    code: string
    type: string
    relevance: number
  }>
}

export function AIKnowledge() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI knowledge assistant. I can help you find relevant information from the OpsMind knowledge base. Ask me about SOPs, technical documents, operational cases, or any support procedures.',
      timestamp: 'Just now',
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSend = async () => {
    if (!query.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: query,
      timestamp: 'Just now',
    }

    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsProcessing(true)

    // Simulate AI processing
    setTimeout(() => {
      const relevantDocs = mockDocuments.filter(doc =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.description.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 3)

      const aiMessage: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: generateAIResponse(query, relevantDocs),
        timestamp: 'Just now',
        sources: relevantDocs.length > 0 ? relevantDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          code: doc.code,
          type: doc.type,
          relevance: 0.9 - Math.random() * 0.2,
        })) : undefined,
      }

      setMessages(prev => [...prev, aiMessage])
      setIsProcessing(false)
    }, 1500)
  }

  const generateAIResponse = (query: string, docs: any[]): string => {
    if (docs.length === 0) {
      return `I couldn't find specific information about "${query}" in the knowledge base. Try rephrasing your question or search for related terms like "POS", "printer", "troubleshooting", or "installation".`
    }

    const docList = docs.map(d => `• ${d.title} (${d.code})`).join('\n')
    return `Based on your question about "${query}", I found ${docs.length} relevant document${docs.length > 1 ? 's' : ''} in the knowledge base:\n\n${docList}\n\nThese documents contain information that may help you. Would you like me to elaborate on any specific document?`
  }

  const suggestedQuestions = [
    'How do I troubleshoot a POS that won\'t power on?',
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
          <span className="text-xs font-semibold text-purple-700">AI-Powered</span>
        </div>
      </div>

      {/* info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-1">How it works</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            I search through all stored documents (SOPs, technical guides, operational cases) to find relevant information for your questions. I retrieve existing knowledge but don't create new organizational information.
          </p>
        </div>
      </div>

      {/* chat container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* messages */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'} rounded-2xl p-4`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-[10px] mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {message.timestamp}
                </p>

                {/* sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/20">
                    <p className="text-[10px] font-semibold mb-2 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Sources:
                    </p>
                    <div className="space-y-2">
                      {message.sources.map((source, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <FileText className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{source.title}</p>
                            <p className="text-slate-400">{source.code} · {source.type}</p>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
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
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  <span className="text-xs text-slate-500">Searching knowledge base...</span>
                </div>
              </div>
            </div>
          )}
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
                onKeyPress={e => e.key === 'Enter' && handleSend()}
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
            AI assists with knowledge retrieval from stored documents. Always verify critical information with official SOPs and consult supervisors for important decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
