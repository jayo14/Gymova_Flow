import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) => {
  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error("EMAIL_FROM environment variable is not set.")
  }

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    console.log("Email sent:", response)
    return response
  } catch (error) {
    console.error("Email error:", error)
    throw error
  }
}
