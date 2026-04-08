#!/usr/bin/env node
/**
 * scripts/upload-resend-templates.mjs
 *
 * Uploads every GymovaFlow email template to the Resend templates library.
 * If a template with the same name already exists it is updated in-place;
 * otherwise a new template is created.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node scripts/upload-resend-templates.mjs
 *
 * Optional env vars:
 *   EMAIL_FROM           – default "from" stored on each template
 *   NEXT_PUBLIC_SITE_URL – base URL used in email links (default: https://gymovaflow.com)
 */

import { Resend } from "resend"

// ── Config ──────────────────────────────────────────────────────────────────
const RESEND_API_KEY = "dummy API"

if (!RESEND_API_KEY) {
  console.error("❌  RESEND_API_KEY is not set.")
  process.exit(1)
}

const DEFAULT_FROM = "GymovaFlow <noreply@mail.gymovaflow.com>"
const FROM = process.env.EMAIL_FROM ?? DEFAULT_FROM
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gymovaflow.com").replace(/\/$/, "")
const resend = new Resend(RESEND_API_KEY)

// ── Inline template helpers (mirrors lib/email/templates/_base.ts) ───────────
function ctaButton(href, label) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:#a3e635;">
        <a href="${href}" target="_blank"
          style="display:inline-block;background-color:#a3e635;color:#131a07;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;text-align:center;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function otpBox(otp) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:28px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
          style="background-color:#1e1e2a;border:1px solid #2d2d3a;border-radius:12px;">
          <tr>
            <td style="padding:24px 40px;">
              <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#a3e635;font-family:'Courier New',Courier,monospace;">
                ${otp}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

function infoBadge(text, color) {
  const bg = color === "#a3e635" ? "#1a2e07" : color === "#c0392b" ? "#2e0a07" : "#1e1e2a"
  return `<span style="display:inline-block;background-color:${bg};color:${color};font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid ${color};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${text}</span>`
}

function wrapEmail(title, bodyHtml) {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d12;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#0d0d12;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#171720;border-radius:16px;overflow:hidden;border:1px solid #2d2d3a;">
          <tr>
            <td align="center" style="padding:32px 40px 28px;border-bottom:1px solid #2d2d3a;background-color:#171720;">
              <span style="font-size:26px;font-weight:800;color:#a3e635;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Gymova</span><span style="font-size:26px;font-weight:800;color:#f9f9f9;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Flow</span>
            </td>
          </tr>
          ${bodyHtml}
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2d2d3a;background-color:#12121a;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      &copy; ${year} GymovaFlow. All rights reserved.
                    </p>
                    <p style="margin:0;font-size:12px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      noreply@mail.gymovaflow.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Template definitions ─────────────────────────────────────────────────────
// Variable placeholders use {{variable_name}} syntax supported by Resend templates.
const templates = [
  {
    name: "gymova-verification",
    subject: "Verify your email – GymovaFlow",
    alias: "gymova-verification",
    html: wrapEmail(
      "Verify your email – GymovaFlow",
      `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Verify your email address
      </h1>
      <p style="margin:0 0 8px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Enter the code below to confirm your email and activate your GymovaFlow account.
      </p>
      ${otpBox("{{otp}}")}
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        This code expires in <strong style="color:#a0a0a0;">15 minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you did not create an account, you can safely ignore this email.
      </p>
    </td>
  </tr>`,
    ),
    variables: [{ key: "otp", type: "string", fallbackValue: "000000" }],
  },
  {
    name: "gymova-welcome",
    subject: "Welcome to GymovaFlow!",
    alias: "gymova-welcome",
    html: wrapEmail(
      "Welcome to GymovaFlow!",
      `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Welcome, {{first_name}}! 🎉
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Your email has been verified and your GymovaFlow account is ready.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        You're now part of a community that's redefining fitness. Browse certified personal
        trainers, book sessions, and start your transformation today.
      </p>
      ${ctaButton("{{login_url}}", "Sign In &amp; Get Started")}
    </td>
  </tr>`,
    ),
    variables: [
      { key: "first_name", type: "string", fallbackValue: "there" },
      { key: "login_url", type: "string", fallbackValue: `${SITE_URL}/login` },
    ],
  },
  {
    name: "gymova-reset-password",
    subject: "Reset your password – GymovaFlow",
    alias: "gymova-reset-password",
    html: wrapEmail(
      "Reset your password – GymovaFlow",
      `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Reset your password
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        We received a request to reset the password for your GymovaFlow account.
        Click the button below to set a new password.
      </p>
      ${ctaButton("{{reset_link}}", "Reset Password")}
      <p style="margin:24px 0 8px;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        This link expires in <strong style="color:#a0a0a0;">1 hour</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
      <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Or copy this link: <a href="{{reset_link}}" style="color:#a0a0a0;">{{reset_link}}</a>
      </p>
    </td>
  </tr>`,
    ),
    variables: [
      { key: "reset_link", type: "string", fallbackValue: `${SITE_URL}/reset-password` },
    ],
  },
  {
    name: "gymova-trainer-approved",
    subject: "Your trainer application was approved – GymovaFlow",
    alias: "gymova-trainer-approved",
    html: wrapEmail(
      "Your trainer application was approved – GymovaFlow",
      `
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="margin:0 0 16px;">${infoBadge("Application Approved", "#a3e635")}</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Congratulations, {{trainer_name}}! 🎉
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        We're thrilled to let you know that your trainer application has been <strong style="color:#a3e635;">approved</strong>.
        You're now a certified GymovaFlow trainer and your public profile is live on the platform.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Head to your trainer dashboard to complete your profile, set your availability, and start accepting clients.
      </p>
      ${ctaButton("{{dashboard_url}}", "Go to Trainer Dashboard")}
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you have any questions, simply reply to this email and our team will be happy to help.
      </p>
    </td>
  </tr>`,
    ),
    variables: [
      { key: "trainer_name", type: "string", fallbackValue: "Trainer" },
      { key: "dashboard_url", type: "string", fallbackValue: `${SITE_URL}/trainer` },
    ],
  },
  {
    name: "gymova-trainer-rejected",
    subject: "Your trainer application status – GymovaFlow",
    alias: "gymova-trainer-rejected",
    html: wrapEmail(
      "Your trainer application status – GymovaFlow",
      `
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="margin:0 0 16px;">${infoBadge("Application Not Approved", "#c0392b")}</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Hi {{trainer_name}},
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Thank you for applying to become a trainer on GymovaFlow. After careful review, we're
        unable to approve your application at this time.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        This decision may be due to incomplete information or requirements that weren't met in this
        submission. You're welcome to update your details and reapply at any time.
      </p>
      ${ctaButton("{{reapply_url}}", "Update &amp; Reapply")}
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you believe this is a mistake or would like more details, please reply to this email and our team will be happy to assist.
      </p>
    </td>
  </tr>`,
    ),
    variables: [
      { key: "trainer_name", type: "string", fallbackValue: "Trainer" },
      { key: "reapply_url", type: "string", fallbackValue: `${SITE_URL}/apply` },
    ],
  },
]

// ── Upload logic ─────────────────────────────────────────────────────────────
async function getExistingTemplates() {
  const result = await resend.templates.list()
  if (result.error) {
    throw new Error(`Failed to list templates: ${result.error.message}`)
  }
  return result.data?.data ?? []
}

async function main() {
  console.log(`\n📤  Uploading ${templates.length} templates to Resend…\n`)

  // Fetch existing templates to decide create vs update
  let existing = []
  try {
    existing = await getExistingTemplates()
  } catch (err) {
    console.error(`❌  Could not list existing templates: ${err.message}`)
    process.exit(1)
  }

  const existingByName = new Map(existing.map((t) => [t.name, t]))

  let created = 0
  let updated = 0
  let failed = 0

  for (const tmpl of templates) {
    const { variables, ...payload } = tmpl
    const existing = existingByName.get(tmpl.name)

    if (existing) {
      // Update
      process.stdout.write(`  → [${tmpl.name}] Updating (id: ${existing.id})… `)
      try {
        const result = await resend.templates.update(existing.id, {
          name: payload.name,
          subject: payload.subject,
          html: payload.html,
          alias: payload.alias,
          from: FROM,
        })
        if (result.error) {
          console.log(`❌  FAILED`)
          console.error(`     Error: ${result.error.message}`)
          failed++
        } else {
          console.log(`✅  Updated`)
          updated++
        }
      } catch (err) {
        console.log(`❌  FAILED`)
        console.error(`     ${err.message}`)
        failed++
      }
    } else {
      // Create
      process.stdout.write(`  → [${tmpl.name}] Creating… `)
      try {
        const result = await resend.templates.create({
          name: payload.name,
          subject: payload.subject,
          html: payload.html,
          alias: payload.alias,
          from: FROM,
          variables,
        })
        if (result.error) {
          console.log(`❌  FAILED`)
          console.error(`     Error: ${result.error.message}`)
          failed++
        } else {
          console.log(`✅  Created (id: ${result.data?.id})`)
          created++
        }
      } catch (err) {
        console.log(`❌  FAILED`)
        console.error(`     ${err.message}`)
        failed++
      }
    }
  }

  console.log(`\n── Summary ──────────────────────────`)
  console.log(`  Created : ${created}`)
  console.log(`  Updated : ${updated}`)
  console.log(`  Failed  : ${failed}`)
  console.log(`  Total   : ${templates.length}\n`)

  if (failed > 0) process.exit(1)
}

main()
