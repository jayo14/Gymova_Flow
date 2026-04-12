import { Resend } from "resend"

const DEFAULT_FROM = "noreply@mail.gymovaflow.com"

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[Resend] FATAL: RESEND_API_KEY is null or undefined in process.env")
    throw new Error("RESEND_API_KEY environment variable is not set.")
  }
  return new Resend(apiKey)
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  const resend = getResendClient()
  
  // Hardcoded 'from' to ensure it exactly matches the configured sender.
  const from = process.env.EMAIL_FROM || DEFAULT_FROM

  // Normalize recipient to an array of trimmed strings.
  const toArray = (Array.isArray(to) ? to : [to]).map(e => e.trim())

  try {
    console.log(`[Resend] Attempting to send email from: ${from}`)
    console.log(`[Resend] Sending to: ${toArray.join(", ")}`)
    console.log(`[Resend] Subject: ${subject}`)
    
    const response = await resend.emails.send({
      from,
      to: toArray,
      subject,
      html,
    })

    if (response.error) {
      console.error("[Resend] API error response:", JSON.stringify(response.error))
      throw new Error(`Resend API error: ${response.error.message || "Unknown error"}`)
    }

    const emailId = response.data?.id
    if (!emailId) {
      console.error("[Resend] API returned success but no email ID")
      throw new Error("Resend API returned success but no email ID was provided")
    }

    console.log(`[Resend] SUCCESS! Email accepted by Resend API. ID: ${emailId}`)
    
    return response
  } catch (error) {
    console.error("[Resend] CRITICAL FAILURE in sendEmail:", error instanceof Error ? error.message : String(error))
    console.error("[Resend] Stack:", error instanceof Error ? error.stack : "")
    throw error
  }
}
