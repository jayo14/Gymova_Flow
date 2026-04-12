import { wrapEmail, ctaButton, infoBadge } from "./_base"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gymovaflow.com"

export const trainerApprovedEmail = (trainerName: string): string => {
  const dashboardUrl = `${SITE_URL.replace(/\/$/, "")}/trainer`

  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="margin:0 0 16px;">
        ${infoBadge("Application Approved", "#a3e635")}
      </p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Congratulations, ${trainerName}! 🎉
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        We're thrilled to let you know that your trainer application has been <strong style="color:#a3e635;">approved</strong>.
        You're now a certified GymovaFlow trainer and your public profile is live on the platform.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Head to your trainer dashboard to complete your profile, set your availability, and start
        accepting clients.
      </p>
      ${ctaButton(dashboardUrl, "Go to Trainer Dashboard")}
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you have any questions, simply reply to this email and our team will be happy to help.
      </p>
    </td>
  </tr>`

  return wrapEmail("Your trainer application was approved – GymovaFlow", body)
}

export const trainerRejectedEmail = (trainerName: string): string => {
  const reapplyUrl = `${SITE_URL.replace(/\/$/, "")}/apply`

  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="margin:0 0 16px;">
        ${infoBadge("Application Not Approved", "#c0392b")}
      </p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Hi ${trainerName},
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Thank you for applying to become a trainer on GymovaFlow. After careful review, we're
        unable to approve your application at this time.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        This decision may be due to incomplete information or requirements that weren't met in this
        submission. You're welcome to update your details and reapply at any time.
      </p>
      ${ctaButton(reapplyUrl, "Update &amp; Reapply")}
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you believe this is a mistake or would like more details, please reply to this email and
        our team will be happy to assist.
      </p>
    </td>
  </tr>`

  return wrapEmail("Your trainer application status – GymovaFlow", body)
}
