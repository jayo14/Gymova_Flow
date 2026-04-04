export const welcomeEmail = (firstName: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to GymovaFlow!</title>
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
                <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;">
                  Welcome, ${firstName}! 🎉
                </h1>
                <p style="margin:0 0 16px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                  Your email has been verified and your GymovaFlow account is ready.
                </p>
                <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                  You're now part of a community that's redefining fitness. Browse certified personal
                  trainers, book sessions, and start your transformation today.
                </p>
                <div style="text-align:center;margin-bottom:24px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://gymovaflow.com"}/login"
                    style="display:inline-block;background-color:#ffffff;color:#0a0a0a;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                    Sign In &amp; Get Started
                  </a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #222222;">
                <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
                  &copy; ${new Date().getFullYear()} GymovaFlow &bull; hello@mail.gymovaflow.com
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
