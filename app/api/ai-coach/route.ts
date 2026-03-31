import { NextRequest, NextResponse } from "next/server"

import { supabaseAdmin } from "@/lib/supabaseAdmin"

const SYSTEM_PROMPT = `You are an expert AI fitness coach on the GymovaFlow
platform. You help clients with workout plans, nutrition basics, and connecting
them with the right personal trainer. Always be encouraging and practical.
When recommending trainers, say you can show them trainers on the platform
that match their goal. Keep responses concise (under 300 words unless a
workout plan is requested). Format workout plans with clear day labels.`

const PROVIDER_PRIORITY = ["openai", "anthropic", "google", "xai", "deepseek"] as const

type AttachmentInput = {
  name?: string
  mimeType: string
  size?: number
  url: string
}

type MessageInput = {
  role: string
  content: string
  attachments?: AttachmentInput[]
}

type ModelConfig = {
  provider: (typeof PROVIDER_PRIORITY)[number]
  model_name: string
  api_key: string
  is_enabled: boolean
}

function isAttachmentSupported(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType === "application/pdf"
}

function formatAttachmentSummary(attachments?: AttachmentInput[]) {
  if (!attachments?.length) return ""

  return attachments
    .map((attachment) => `Attachment: ${attachment.name ?? "file"} (${attachment.mimeType}) ${attachment.url}`)
    .join("\n")
}

function toPlainTextMessages(messages: MessageInput[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: [message.content?.trim(), formatAttachmentSummary(message.attachments)].filter(Boolean).join("\n\n"),
  }))
}

async function attachmentToInlinePart(attachment: AttachmentInput) {
  if (!isAttachmentSupported(attachment.mimeType) || !attachment.url) return null

  try {
    const res = await fetch(attachment.url)
    if (!res.ok) return null

    const arrayBuffer = await res.arrayBuffer()
    const data = Buffer.from(arrayBuffer).toString("base64")

    return {
      inlineData: {
        mimeType: attachment.mimeType,
        data,
      },
    }
  } catch {
    return null
  }
}

async function getActiveModelConfig(): Promise<ModelConfig | null> {
  const { data, error } = await supabaseAdmin
    .from("ai_model_configs")
    .select("provider, model_name, api_key, is_enabled")
    .eq("is_enabled", true)

  if (!error && data) {
    for (const provider of PROVIDER_PRIORITY) {
      const match = data.find(
        (row) => row.provider === provider && row.is_enabled && typeof row.api_key === "string" && row.api_key.length > 0
      )
      if (match) {
        return match as ModelConfig
      }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "google",
      model_name: "gemini-2.5-flash",
      api_key: process.env.GEMINI_API_KEY,
      is_enabled: true,
    }
  }

  return null
}

async function callGemini(messages: MessageInput[], config: ModelConfig) {
  const contents = await Promise.all(
    messages.map(async (message) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: message.content?.trim() || (message.attachments?.length ? "Please analyze my attachments." : "") },
      ]

      if (message.role !== "assistant" && Array.isArray(message.attachments) && message.attachments.length > 0) {
        const attachmentParts = await Promise.all(message.attachments.map(attachmentToInlinePart))
        parts.push(...attachmentParts.filter((part): part is { inlineData: { mimeType: string; data: string } } => part !== null))
      }

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts,
      }
    })
  )

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model_name}:generateContent?key=${config.api_key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(await res.text())
  }

  const data = await res.json()
  return (
    data.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text ??
    "Sorry, I could not respond."
  )
}

function toOpenAIContent(message: MessageInput) {
  const baseText = message.content?.trim() || (message.attachments?.length ? "Please analyze my attachments." : "")
  const attachments = message.attachments ?? []

  if (attachments.length === 0) {
    return baseText
  }

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = []
  if (baseText) {
    content.push({ type: "text", text: baseText })
  }

  for (const attachment of attachments) {
    if (attachment.mimeType.startsWith("image/")) {
      content.push({ type: "image_url", image_url: { url: attachment.url } })
    } else {
      content.push({ type: "text", text: formatAttachmentSummary([attachment]) })
    }
  }

  return content
}

async function callOpenAICompatible(messages: MessageInput[], config: ModelConfig, baseUrl: string) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model_name,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: toOpenAIContent(message),
        })),
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? "Sorry, I could not respond."
}

async function callAnthropic(messages: MessageInput[], config: ModelConfig) {
  const anthropicMessages = toPlainTextMessages(messages)
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.api_key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.model_name,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    }),
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  const data = await res.json()
  return data.content?.find((part: { type?: string; text?: string }) => part.type === "text")?.text ?? "Sorry, I could not respond."
}

export async function POST(req: NextRequest) {
  try {
    const config = await getActiveModelConfig()
    if (!config) {
      return NextResponse.json({ reply: "AI service is not configured yet." }, { status: 500 })
    }

    const { messages } = await req.json()
    const parsedMessages = (messages ?? []) as MessageInput[]

    let reply = "Sorry, I could not respond."

    if (config.provider === "google") {
      reply = await callGemini(parsedMessages, config)
    } else if (config.provider === "anthropic") {
      reply = await callAnthropic(parsedMessages, config)
    } else if (config.provider === "openai") {
      reply = await callOpenAICompatible(parsedMessages, config, "https://api.openai.com/v1")
    } else if (config.provider === "xai") {
      reply = await callOpenAICompatible(parsedMessages, config, "https://api.x.ai/v1")
    } else if (config.provider === "deepseek") {
      reply = await callOpenAICompatible(parsedMessages, config, "https://api.deepseek.com")
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("AI coach route error:", error)
    return NextResponse.json({ reply: "Sorry, I could not process that right now." }, { status: 500 })
  }
}
