import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * GYMOVA FLOW - Email Webhook Edge Function
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_URL = Deno.env.get('SITE_URL') || 'https://gymovaflow.app'
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'GymovaFlow <noreply@mail.gymovaflow.com>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// --- Template Helpers ---

function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:#a3e635;">
        <a href="${href}"
          target="_blank"
          style="display:inline-block;background-color:#a3e635;color:#131a07;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;mso-padding-alt:0;text-align:center;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function infoBadge(text: string, color: string): string {
  const bg = color === "#a3e635" ? "#1a2e07" : color === "#c0392b" ? "#2e0a07" : "#1e1e2a"
  return `<span style="display:inline-block;background-color:${bg};color:${color};font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid ${color};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${text}</span>`
}

function wrapEmail(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d12;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#171720;border-radius:16px;overflow:hidden;border:1px solid #2d2d3a;">
          <tr>
            <td align="center" style="padding:32px 40px 28px;border-bottom:1px solid #2d2d3a;background-color:#171720;">
              <span style="font-size:26px;font-weight:800;color:#a3e635;letter-spacing:-0.5px;">Gymova</span><span style="font-size:26px;font-weight:800;color:#f9f9f9;letter-spacing:-0.5px;">Flow</span>
            </td>
          </tr>
          ${bodyHtml}
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2d2d3a;background-color:#12121a;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">&copy; ${year} GymovaFlow. All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#6b7280;">${EMAIL_FROM}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// --- Specific Templates ---

function welcomeEmail(firstName: string): string {
  const loginUrl = `${SITE_URL}/login`
  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;">Welcome, ${firstName}! 🎉</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;">Your email has been verified and your GymovaFlow account is ready.</p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;">You're now part of a community that's redefining fitness. Browse certified personal trainers, book sessions, and start your transformation today.</p>
      ${ctaButton(loginUrl, "Sign In & Get Started")}
    </td>
  </tr>`
  return wrapEmail("Welcome to GymovaFlow!", body)
}

function trainerApprovedEmail(trainerName: string): string {
  const dashboardUrl = `${SITE_URL}/trainer`
  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="margin:0 0 16px;">${infoBadge("Application Approved", "#a3e635")}</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;">Congratulations, ${trainerName}! 🎉</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;">We're thrilled to let you know that your trainer application has been approved.</p>
      ${ctaButton(dashboardUrl, "Go to Trainer Dashboard")}
    </td>
  </tr>`
  return wrapEmail("Application Approved – GymovaFlow", body)
}

function trainerRejectedEmail(trainerName: string): string {
  const applyUrl = `${SITE_URL}/apply`
  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="margin:0 0 16px;">${infoBadge("Application Update", "#c0392b")}</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;">Hi ${trainerName},</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;">Thank you for applying to become a trainer. After review, we're unable to approve your application at this time.</p>
      ${ctaButton(applyUrl, "Update & Reapply")}
    </td>
  </tr>`
  return wrapEmail("Trainer Application Status – GymovaFlow", body)
}

// --- Main Handler ---

serve(async (req) => {
  if (!RESEND_API_KEY) {
    return new Response('Internal error: No API key', { status: 500 })
  }

  try {
    const payload = await req.json()
    const { table, type, record, old_record } = payload

    let emailTo = ''
    let subject = ''
    let html = ''

    // Route based on table and change type
    // (Note: Welcome email is now handled by a separate delayed cron job)
    
    if (table === 'trainer_applications' && type === 'UPDATE') {
      if (record.status !== old_record.status) {
        emailTo = record.email
        const trainerName = record.name || 'Trainer'
        
        if (record.status === 'approved') {
          subject = 'Your trainer application was approved – GymovaFlow'
          html = trainerApprovedEmail(trainerName)
        } else if (record.status === 'rejected') {
          subject = 'Your trainer application status – GymovaFlow'
          html = trainerRejectedEmail(trainerName)
        }
      }
    }

    if (!emailTo || !html) {
      return new Response('Ignored', { status: 200 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: emailTo,
        subject: subject,
        html: html,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Email Webhook Exception:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
