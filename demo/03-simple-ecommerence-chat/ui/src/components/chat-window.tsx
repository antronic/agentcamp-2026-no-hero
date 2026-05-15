/**
 * ChatWindow — Floating chat overlay for talking to Agent Smith.
 * Appears as a fixed panel in the bottom-right corner of the screen.
 */

import { useState, useRef, useEffect, type FormEvent } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, X, Minus } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9000'

interface ChatWindowProps {
  onClose: () => void
  onMinimize: () => void
}

export function ChatWindow({ onClose, onMinimize }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Agent Smith 🤖\nYour ZStore assistant. Ask me about products, stock, orders, or anything else!' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I couldn't reach the server. ${err}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 flex h-130 w-100 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">AS</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-none">Agent Smith</p>
            <p className="text-xs text-muted-foreground">ZStore Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMinimize}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages — scrollable container */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Avatar className="mt-0.5 h-6 w-6 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">AS</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Style tables for dark theme
                      table: ({ children }) => (
                        <table className="my-1.5 w-full border-collapse text-[12px]">{children}</table>
                      ),
                      th: ({ children }) => (
                        <th className="border border-border bg-background/50 px-2 py-1 text-left font-semibold">{children}</th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border px-2 py-1">{children}</td>
                      ),
                      // Style lists
                      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                      // Inline code & code blocks
                      code: ({ children }) => (
                        <code className="rounded bg-background/50 px-1 py-0.5 text-[11px] font-mono">{children}</code>
                      ),
                      // Paragraphs — tighter spacing
                      p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
                      // Bold
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </Markdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <Avatar className="mt-0.5 h-6 w-6 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">AS</AvatarFallback>
              </Avatar>
              <div className="rounded-xl rounded-bl-sm bg-muted px-3 py-2 text-[13px] text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                </span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card px-3 py-2.5">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            autoComplete="off"
            className="h-9 flex-1 rounded-full border-border bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
