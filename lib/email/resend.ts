import { Resend } from "resend"

const DEFAULT_FROM = "GymovaFlow <noreply@mail.gymovaflow.com>"

let _resend: Resend | null = null

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set.")
  }
  if (!_resend) {
    _resend = new Resend(apiKey)
  }
  return _resend
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export const sendEmail = async ({ to, subject, html, replyTo }: SendEmailOptions) => {
  const resend = getResendClient()
  
  // Normalize 'from' address. Resend prefers "Name <email@domain.com>" format.
  // If EMAIL_FROM is just an email, wrap it with the default name.
  let from = process.env.EMAIL_FROM ?? DEFAULT_FROM
  if (!from.includes("<") && from.includes("@")) {
    from = `GymovaFlow <${from}>`
  }

  // Ensure 'to' is an array of trimmed email strings.
  const recipientList = (Array.isArray(to) ? to : [to]).map(e => e.trim())

  try {
    const response = await resend.emails.send({
      from,
      to: recipientList,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    })

    if (response.error) {
      console.error("[Resend] API error detail:", JSON.stringify(response.error, null, 2))
      throw new Error(response.error.message)
    }

    console.log(`[Resend] Email successfully queued — ID: ${response.data?.id} — Recipient: ${recipientList.join(", ")}`)
    return response
  } catch (error) {
    console.error("[Resend] sendEmail failed critically:", error)
    throw error
  }
}
