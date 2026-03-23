"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Send,
  Sparkles,
  ArrowLeft,
  User,
  Dumbbell,
  Lightbulb,
  Target,
  Users,
  RefreshCw,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

// Lightweight markdown renderer: bold, headers, unordered lists
function MarkdownContent({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // H3 ###
    if (line.startsWith("### ")) {
      elements.push(
        <p key={i} className="font-semibold mt-3 mb-1">
          {renderInline(line.slice(4))}
        </p>
      )
    }
    // H2 ##
    else if (line.startsWith("## ")) {
      elements.push(
        <p key={i} className="font-bold mt-4 mb-1">
          {renderInline(line.slice(3))}
        </p>
      )
    }
    // H1 #
    else if (line.startsWith("# ")) {
      elements.push(
        <p key={i} className="font-bold text-base mt-4 mb-1">
          {renderInline(line.slice(2))}
        </p>
      )
    }
    // Unordered list - or *
    else if (/^[-*] /.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5">
          <span className="shrink-0 mt-px">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    }
    // Numbered list
    else if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. (.*)$/)
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 my-0.5">
            <span className="shrink-0 mt-px">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        )
      }
    }
    // Empty line = spacer
    else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />)
    }
    // Normal paragraph
    else {
      elements.push(
        <p key={i} className="my-0.5">
          {renderInline(line)}
        </p>
      )
    }
  }

  return <div className={`text-sm leading-relaxed ${className ?? ""}`}>{elements}</div>
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

const examplePrompts = [
  {
    icon: Lightbulb,
    title: "Create a workout routine",
    prompt: "Create a beginner workout routine for building muscle"
  },
  {
    icon: Target,
    title: "Help me lose weight",
    prompt: "Help me create a plan to lose 10 pounds in 2 months"
  },
  {
    icon: Users,
    title: "Find the right trainer",
    prompt: "Suggest trainers for muscle gain and strength training"
  },
  {
    icon: Dumbbell,
    title: "Exercise suggestions",
    prompt: "What are the best exercises for building core strength?"
  }
]

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
}

const initialMessages: Message[] = []

export default function AICoachPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, loading } = useAuth()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const sentInitialRef = useRef(false)

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login")
    }
  }, [loading, session, router])

  // Auto-send query from ?q= param (e.g. from dashboard quick-send)
  useEffect(() => {
    if (loading || !session || sentInitialRef.current) return
    const q = searchParams?.get("q")
    if (q) {
      sentInitialRef.current = true
      handleSend(q)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, searchParams])

  if (loading || (!session && typeof window !== "undefined")) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Checking your session...</span>
      </div>
    )
  }

  const handleSend = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: message,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const { reply } = await res.json()
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, I had trouble connecting. Please try again.",
        },
      ])
=======
    const userMsg: Message = { id: Date.now(), role: 'user', content: message }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
      })
      const { reply } = await res.json()
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again.' }])
>>>>>>> c3801a2 (Implement AI coach API endpoint and update message handling in AICoachPage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (prompt: string) => {
    handleSend(prompt)
  }

  const handleNewChat = () => {
    setMessages([])
    setInput("")
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">AI Fitness Coach</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewChat}>
            <RefreshCw className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-16 pb-24 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">AI Fitness Coach</h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Ask me anything about fitness, workouts, nutrition, or finding the right trainer for your goals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example.prompt)}
                    className="text-left p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <example.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-card-foreground">{example.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{example.prompt}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${message.role === "user" ? "order-1" : ""}`}>
                    <Card className={`${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border-border"}`}>
                      <CardContent className="p-4">
                        {message.role === "assistant" ? (
                          <MarkdownContent
                            text={message.content}
                            className="text-card-foreground"
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap text-primary-foreground">
                            {message.content}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask me anything about fitness..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend(input)}
              disabled={isLoading}
              className="flex-1 bg-input border-border"
            />
            <Button 
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI Coach provides general fitness guidance. Consult a professional for personalized advice.
          </p>
        </div>
      </div>
    </div>
  )
}
