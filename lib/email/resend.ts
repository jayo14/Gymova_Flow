import { Resend } from "resend"

const DEFAULT_FROM = "GymovaFlow <noreply@mail.gymovaflow.com>"

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export const sendEmail = async ({ to, subject, html, replyTo }: SendEmailOptions) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set.")
  }

  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM

  const resend = new Resend(apiKey)

  try {
    const response = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    })

    if (response.error) {
      console.error("[Resend] API error:", response.error)
      throw new Error(response.error.message)
    }

    console.log(`[Resend] Email sent to ${Array.isArray(to) ? to.join(", ") : to} — id: ${response.data?.id}`)
    return response
  } catch (error) {
    console.error("[Resend] sendEmail threw:", error)
    throw error
  }
}
