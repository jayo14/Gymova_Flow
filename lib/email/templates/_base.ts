// Shared HTML wrapper used by every email template.
// Call wrapEmail(title, bodyHtml) to get a full DOCTYPE document.

export function wrapEmail(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear()
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@mail.gymovaflow.com"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0d0d12;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Outer wrapper table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#0d0d12;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!-- Card container — max 600px -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#171720;border-radius:16px;overflow:hidden;border:1px solid #2d2d3a;">

          <!-- ── HEADER ── -->
          <tr>
            <td align="center"
              style="padding:32px 40px 28px;border-bottom:1px solid #2d2d3a;background-color:#171720;">
              <span style="font-size:26px;font-weight:800;color:#a3e635;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Gymova</span><span style="font-size:26px;font-weight:800;color:#f9f9f9;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Flow</span>
            </td>
          </tr>

          <!-- ── BODY (injected per template) ── -->
          ${bodyHtml}

          <!-- ── FOOTER ── -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2d2d3a;background-color:#12121a;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      &copy; ${year} GymovaFlow. All rights reserved.
                    </p>
                    <p style="margin:0;font-size:12px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ${fromEmail}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table><!-- /card -->
      </td>
    </tr>
  </table><!-- /outer wrapper -->
</body>
</html>`
}

// Reusable CTA button snippet
export function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:#a3e635;">
        <!--[if mso]><a href="${href}" style="display:inline-block;background-color:#a3e635;padding:14px 32px;border-radius:8px;"><![endif]-->
        <a href="${href}"
          target="_blank"
          style="display:inline-block;background-color:#a3e635;color:#131a07;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;mso-padding-alt:0;text-align:center;">
          ${label}
        </a>
        <!--[if mso]></a><![endif]-->
      </td>
    </tr>
  </table>`
}

// Reusable OTP code display
export function otpBox(otp: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:28px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
          style="background-color:#1e1e2a;border:1px solid #2d2d3a;border-radius:12px;padding:0;">
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

// Info badge (used for trainer status chips, warnings, etc.)
export function infoBadge(text: string, color: "#a3e635" | "#c0392b" | "#a0a0a0"): string {
  const bg = color === "#a3e635" ? "#1a2e07" : color === "#c0392b" ? "#2e0a07" : "#1e1e2a"
  return `<span style="display:inline-block;background-color:${bg};color:${color};font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid ${color};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${text}</span>`
}
