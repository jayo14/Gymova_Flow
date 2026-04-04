export const resetPasswordEmail = (resetLink: string, fromEmail = "noreply@mail.gymovaflow.com") => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your password – GymovaFlow</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;overflow:hidden;border:1px solid #222222;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding:32px 40px 24px;">
                <span style="font-size:22px;font-weight:700;color:#ffffff;">GymovaFlow</span>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:0 40px 32px;">
                <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;">Reset your password</h1>
                <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                  We received a request to reset the password for your GymovaFlow account.
                  Click the button below to set a new password.
                </p>
                <!-- CTA Button -->
                <div style="text-align:center;margin-bottom:24px;">
                  <a href="${resetLink}"
                    style="display:inline-block;background-color:#ffffff;color:#0a0a0a;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                    Reset Password
                  </a>
                </div>
                <p style="margin:0 0 8px;font-size:13px;color:#71717a;">
                  This link expires in <strong style="color:#a1a1aa;">1 hour</strong>.
                </p>
                <p style="margin:0 0 8px;font-size:13px;color:#71717a;">
                  If you did not request a password reset, you can safely ignore this email.
                </p>
                <p style="margin:16px 0 0;font-size:12px;color:#52525b;word-break:break-all;">
                  Or copy this link: <a href="${resetLink}" style="color:#a1a1aa;">${resetLink}</a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #222222;">
                <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
                  &copy; ${new Date().getFullYear()} GymovaFlow &bull; ${fromEmail}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
