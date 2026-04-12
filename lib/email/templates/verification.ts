import { wrapEmail, otpBox } from "./_base"

export const verificationEmail = (otp: string): string => {
  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Verify your email address
      </h1>
      <p style="margin:0 0 8px;font-size:15px;color:#a0a0a0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Enter the code below to confirm your email and activate your GymovaFlow account.
      </p>
      ${otpBox(otp)}
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        This code expires in <strong style="color:#a0a0a0;">15 minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        If you did not create an account, you can safely ignore this email.
      </p>
    </td>
  </tr>`

  return wrapEmail("Verify your email – GymovaFlow", body)
}
