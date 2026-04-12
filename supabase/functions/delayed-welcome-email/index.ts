import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * GYMOVA FLOW - Delayed Welcome Email Swapper
 * 
 * This function should be triggered by pg_cron every hour.
 * It finds users who registered > 24 hours ago and sends them a welcome email.
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
        <a href="${href}" target="_blank" style="display:inline-block;background-color:#a3e635;color:#131a07;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;mso-padding-alt:0;text-align:center;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function wrapEmail(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d12;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#171720;border-radius:16px;overflow:hidden;border:1px solid #2d2d3a;">
          <tr>
            <td align="center" style="padding:32px 40px 28px;border-bottom:1px solid #2d2d3a;background-color:#171720;">
              <span style="font-size:26px;font-weight:800;color:#a3e635;">Gymova</span><span style="font-size:26px;font-weight:800;color:#f9f9f9;">Flow</span>
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

function welcomeEmail(firstName: string): string {
  const loginUrl = `${SITE_URL}/login`
  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;">Welcome, ${firstName}! 🎉</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;">Your email was verified 24 hours ago and we wanted to officially welcome you to the community.</p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;">You're now part of a community that's redefining fitness. Browse certified personal trainers, book sessions, and start your transformation today.</p>
      ${ctaButton(loginUrl, "Sign In & Get Started")}
    </td>
  </tr>`
  return wrapEmail("Welcome to GymovaFlow!", body)
}

// --- Main Handler ---

serve(async (req) => {
  if (!RESEND_API_KEY) return new Response('Missing API Key', { status: 500 })

  try {
    // 1. Find users who registered > 24h ago and haven't received the welcome email
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'client')
      .eq('welcome_email_sent', false)
      .lte('created_at', oneDayAgo)
      .limit(10) // Process in small batches

    if (fetchError) throw fetchError
    if (!profiles || profiles.length === 0) return new Response('No pending emails', { status: 200 })

    const results = []

    for (const profile of profiles) {
      try {
        // Fetch email address from auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)
        if (authError || !authUser.user?.email) {
          console.error(`Could not find email for user ${profile.id}:`, authError)
          continue
        }

        const emailTo = authUser.user.email
        const firstName = profile.full_name?.split(' ')[0] || 'there'

        // Send Email
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: emailTo,
            subject: 'Welcome to GymovaFlow! 🎉',
            html: welcomeEmail(firstName),
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          console.error(`Failed to send email to ${emailTo}:`, errorData)
          continue
        }

        // Mark as sent
        await supabase
          .from('profiles')
          .update({ welcome_email_sent: true })
          .eq('id', profile.id)

        results.push({ id: profile.id, status: 'sent' })
      } catch (err) {
        console.error(`Error processing user ${profile.id}:`, err)
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Delayed Email Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
