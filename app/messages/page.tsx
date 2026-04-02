"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  Phone,
  Search,
  Send,
  Video,
} from "lucide-react"

import { useAuth } from "@/components/auth/AuthProvider"
import { AthleteDashboardShell } from "@/components/dashboard/AthleteDashboardShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  getConversationMessages,
  getThreadMessages,
  markMessagesAsRead,
  sendMessage,
} from "@/lib/supabase/messages"
import { supabase } from "@/lib/supabaseClient"
import type { Message } from "@/types/message"

type ConversationSummary = {
  partnerId: string
  partnerName: string
  partnerAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationSummary
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-border transition-colors ${
        isSelected ? "bg-secondary" : "hover:bg-secondary/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          {conversation.partnerAvatar ? (
            <img
              src={conversation.partnerAvatar}
              alt={conversation.partnerName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground truncate">{conversation.partnerName}</h3>
            <span className="text-xs text-muted-foreground">{conversation.lastMessageTime}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
        </div>

        {conversation.unreadCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs text-primary-foreground">{conversation.unreadCount}</span>
          </div>
        )}
      </div>
    </button>
  )
}

function MessageBubble({
  message,
  currentUserId,
}: {
  message: Message
  currentUserId: string
}) {
  const isOwn = message.sender_id === currentUserId

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isOwn ? "order-2" : ""}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-foreground rounded-bl-md"
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
          <span className="text-xs text-muted-foreground">{formatMessageTime(message.created_at)}</span>
          {isOwn &&
            (message.is_read ? (
              <CheckCheck className="w-3 h-3 text-primary" />
            ) : (
              <Check className="w-3 h-3 text-muted-foreground" />
            ))}
        </div>
      </div>
    </div>
  )
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, user, loading } = useAuth()
  const { toast } = useToast()

  const newChatId = searchParams?.get("new_chat")
  const newChatName = searchParams?.get("name")
  const newChatAvatar = searchParams?.get("avatar")

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(() => {
    if (newChatId && newChatName) {
      return {
        partnerId: newChatId,
        partnerName: newChatName,
        partnerAvatar: newChatAvatar || undefined,
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: 0,
      }
    }
    return null
  })
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showConversations, setShowConversations] = useState(() => !newChatId)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedConversationRef = useRef<ConversationSummary | null>(null)

  const appendUniqueMessage = useCallback((message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
  }, [])

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login")
    }
  }, [loading, router, session])

  const fetchConversations = useCallback(async () => {
    if (!user) return

    setLoadingConversations(true)
    const { data: rows, error } = await getConversationMessages(user.id)

    if (error) {
      toast({
        title: "Error loading conversations",
        description: "Failed to load your conversations. Please try again.",
        variant: "destructive",
      })
      setLoadingConversations(false)
      return
    }

    const unreadCounts = new Map<string, number>()
    for (const msg of rows) {
      if (msg.receiver_id === user.id && !msg.is_read) {
        unreadCounts.set(msg.sender_id, (unreadCounts.get(msg.sender_id) ?? 0) + 1)
      }
    }

    const partnerMap = new Map<string, ConversationSummary>()
    for (const msg of rows) {
      const isOwn = msg.sender_id === user.id
      const partnerId = isOwn ? msg.receiver_id : msg.sender_id
      const partner = isOwn ? msg.receiver : msg.sender

      if (partnerMap.has(partnerId)) continue

      partnerMap.set(partnerId, {
        partnerId,
        partnerName: partner?.full_name ?? "Unknown",
        partnerAvatar: partner?.avatar_url ?? undefined,
        lastMessage: msg.content,
        lastMessageTime: formatTime(msg.created_at),
        unreadCount: unreadCounts.get(partnerId) ?? 0,
      })
    }

    setConversations(Array.from(partnerMap.values()))
    setLoadingConversations(false)
  }, [toast, user])

  useEffect(() => {
    void fetchConversations()
  }, [fetchConversations])

  const markAsRead = useCallback(
    async (partnerId: string) => {
      if (!user) return
      const { error } = await markMessagesAsRead(user.id, partnerId)
      if (error) {
        console.error("Error marking messages as read:", error)
      }
    },
    [user]
  )

  const fetchMessages = useCallback(
    async (partnerId: string) => {
      if (!user) return

      setLoadingMessages(true)
      const { data, error } = await getThreadMessages(user.id, partnerId)

      if (error) {
        toast({
          title: "Error loading messages",
          description: "Failed to load messages for this conversation.",
          variant: "destructive",
        })
      } else {
        setMessages(data)
      }

      setLoadingMessages(false)
    },
    [toast, user]
  )

  useEffect(() => {
    if (newChatId && user) {
      void fetchMessages(newChatId)
      void markAsRead(newChatId)
    }
  }, [newChatId, user, fetchMessages, markAsRead])

  const handleSelectConversation = useCallback(
    async (conversation: ConversationSummary) => {
      setSelectedConversation(conversation)
      setShowConversations(false)

      await fetchMessages(conversation.partnerId)
      await markAsRead(conversation.partnerId)

      setConversations((prev) =>
        prev.map((item) =>
          item.partnerId === conversation.partnerId
            ? { ...item, unreadCount: 0 }
            : item
        )
      )
    },
    [fetchMessages, markAsRead]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as Message
          const activePartnerId = selectedConversationRef.current?.partnerId

          if (!activePartnerId) {
            void fetchConversations()
            return
          }

          if (msg.sender_id === activePartnerId || msg.receiver_id === activePartnerId) {
            appendUniqueMessage(msg)
            if (msg.sender_id === activePartnerId) {
              void markAsRead(activePartnerId)
            }
          }

          void fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [appendUniqueMessage, fetchConversations, markAsRead, user])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedConversation) return

    const content = newMessage.trim()
    setNewMessage("")

    const { data, error } = await sendMessage({
      sender_id: user.id,
      receiver_id: selectedConversation.partnerId,
      content,
    })

    if (error) {
      toast({
        title: "Message failed",
        description: error,
        variant: "destructive",
      })
      return
    }

    if (data) appendUniqueMessage(data)
    void fetchConversations()
  }

  if (loading || (!session && typeof window !== "undefined")) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Checking your session...</span>
      </div>
    )
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AthleteDashboardShell title="Messages" contentClassName="p-0">
      <div className="h-[calc(100vh-4rem)] bg-background flex">
        <aside
          className={`w-full lg:w-80 border-r border-border bg-background shrink-0 ${
            showConversations ? "block" : "hidden lg:block"
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No conversations yet</div>
              ) : (
                filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.partnerId}
                    conversation={conversation}
                    isSelected={selectedConversation?.partnerId === conversation.partnerId}
                    onClick={() => void handleSelectConversation(conversation)}
                  />
                ))
              )}
            </div>
          </div>
        </aside>

        <div className={`flex-1 flex flex-col ${showConversations ? "hidden lg:flex" : "flex"}`}>
          {selectedConversation ? (
            <>
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
                <button onClick={() => setShowConversations(true)} className="flex items-center gap-2 text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary" />
                  <span className="font-medium text-foreground">{selectedConversation.partnerName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {selectedConversation.partnerAvatar ? (
                    <img
                      src={selectedConversation.partnerAvatar}
                      alt={selectedConversation.partnerName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary" />
                  )}
                  <h2 className="font-medium text-foreground">{selectedConversation.partnerName}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-muted-foreground text-sm">Loading messages...</span>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} currentUserId={user!.id} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        void handleSendMessage()
                      }
                    }}
                    className="flex-1 bg-input border-border"
                  />
                  <Button
                    onClick={() => void handleSendMessage()}
                    disabled={!newMessage.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </AthleteDashboardShell>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground animate-pulse">Loading messaging module...</span>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
