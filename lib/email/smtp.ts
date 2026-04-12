import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT ?? 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendEmailSmtp = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) => {
  try {
    const from = process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("<")
      ? `GymovaFlow <${process.env.EMAIL_FROM}>`
      : process.env.EMAIL_FROM

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    })

    console.log("Email sent via SMTP:", info.messageId)
    return info
  } catch (error) {
    console.error("SMTP email error:", error)
    throw error
  }
}
