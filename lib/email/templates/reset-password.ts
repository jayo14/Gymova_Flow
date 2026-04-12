import { wrapEmail, ctaButton } from "./_base"

export const resetPasswordEmail = (resetLink: string): string => {
  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Reset your password
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        We received a request to reset the password for your GymovaFlow account.
        Click the button below to set a new password.
      </p>
      ${ctaButton(resetLink, "Reset Password")}
      <p style="margin:24px 0 8px;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        This link expires in <strong style="color:#a0a0a0;">1 hour</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
      <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Or copy this link: <a href="${resetLink}" style="color:#a0a0a0;">${resetLink}</a>
      </p>
    </td>
  </tr>`

  return wrapEmail("Reset your password – GymovaFlow", body)
}
