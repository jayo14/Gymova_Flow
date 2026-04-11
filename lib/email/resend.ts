import { Resend } from "resend"

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
  
  // Hardcoded 'from' to ensure it exactly matches the working test script.
  const from = "GymovaFlow <noreply@mail.gymovaflow.com>"

  // Normalize recipient to an array of trimmed strings.
  const toArray = (Array.isArray(to) ? to : [to]).map(e => e.trim())

  try {
    console.log(`[Resend] Attempting to send email to: ${toArray.join(", ")}...`)
    
    const response = await resend.emails.send({
      from,
      to: toArray,
      subject,
      html,
    })

    if (response.error) {
      console.error("[Resend] API error response:", response.error)
      throw new Error(response.error.message || "Unknown Resend API error")
    }

    const emailId = response.data?.id
    console.log(`[Resend] SUCCESS! Email accepted by Resend API. ID: ${emailId}`)
    
    return response
  } catch (error) {
    console.error("[Resend] CRITICAL FAILURE in sendEmail:", error)
    throw error
  }
}
