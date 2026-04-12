import { wrapEmail, ctaButton } from "./_base"

export const welcomeEmail = (firstName: string, siteUrl = "https://gymovaflow.com"): string => {
  const loginUrl = `${siteUrl.replace(/\/$/, "")}/login`

  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Welcome, ${firstName}! 🎉
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Your email has been verified and your GymovaFlow account is ready.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        You're now part of a community that's redefining fitness. Browse certified personal
        trainers, book sessions, and start your transformation today.
      </p>
      ${ctaButton(loginUrl, "Sign In &amp; Get Started")}
    </td>
  </tr>`

  return wrapEmail("Welcome to GymovaFlow!", body)
}
