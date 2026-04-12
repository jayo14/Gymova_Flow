# Email Configuration Guide

## Overview

GymovaFlow uses **Resend** for all transactional emails:
- Email verification codes during signup
- Password reset links
- Welcome emails
- Trainer application notifications

## Problem: Emails Not Being Delivered

If users see "Email sent" but don't receive emails, the issue is typically:

### ❌ Root Cause: Unverified Sender Domain

The application is configured to send from `noreply@mail.gymovaflow.com`, which **must be verified in your Resend account** before emails will be delivered.

### ✅ Solution: Verify Your Domain in Resend

1. **Go to Resend Domains**: https://resend.com/domains

2. **Add Domain**:
   - Click "Add Domain"
   - Enter: `mail.gymovaflow.com`
   - Click "Add"

3. **Configure DNS Records**:
   - Resend will provide you with DNS records to add
   - Add these records to your domain's DNS provider:
     - CNAME record for domain verification
     - SPF record (usually `v=spf1 include:resend.com ~all`)
     - DKIM records (2-3 records)

4. **Wait for Verification**:
   - DNS propagation can take 15 minutes to 48 hours
   - Check status in Resend dashboard
   - Status will show "✓ Verified" when complete

5. **Test Email Sending**:
   ```bash
   npm run test:email
   ```

## Configuration Files

### `.env.local` (Required)

```env
# Resend API key - get from https://resend.com/api-keys
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXX

# Email sender address (must match verified domain)
EMAIL_FROM=noreply@mail.gymovaflow.com

# Site URL for email links
NEXT_PUBLIC_SITE_URL=https://gymovaflow.com
```

## How Email Sending Works

### Flow:
1. User triggers email action (e.g., forgot password)
2. Backend API route creates email token/content
3. Calls `sendEmail()` from `lib/email/resend.ts`
4. `sendEmail()` connects to Resend API
5. Resend delivers email or returns error

### Files Involved:
- **Routes**: `app/api/auth/{signup,forgot-password,resend-verification,verify-email}/route.ts`
- **Resend Integration**: `lib/email/resend.ts`
- **Email Templates**: `lib/email/templates/*.ts`

## Troubleshooting

### Issue: "Email sent" but not received

**Check 1: Domain Verified?**
```bash
node scripts/diagnose-email.mjs
```

**Check 2: Resend Logs**
- Visit: https://resend.com/emails
- Look for your test emails
- Check if status is "sent", "bounced", or "failed"

**Check 3: Server Logs**
- Check application server logs for `[Resend]` messages
- Look for error details about API responses

### Issue: API Key Invalid

**Error**: `401 Unauthorized` or `Invalid API key`

**Solution**:
1. Get fresh API key: https://resend.com/api-keys
2. Update `.env.local`
3. Restart server

### Issue: Emails go to spam

**Causes**:
- Domain not verified
- No DKIM/SPF records
- Unverified domain sends from `onboarding_@resend.dev`

**Solution**:
- Complete all DNS verification steps in Resend dashboard
- Check SPF/DKIM status is "✓ Verified"

### Issue: Sandbox Mode (Free Tier)

**Limitation**: Free tier Resend account can only send to:
- Your own email
- Test emails (addresses you add explicitly)

**Solution**:
- Add test recipient emails to Resend: https://resend.com/settings
- OR upgrade to paid plan for unlimited recipients

## Testing

### Test Email Script

```bash
# Requires test email address
npm run test:email

# Example:
TEST_EMAIL=user@example.com npm run test:email
```

This sends test versions of all email templates to verify they render correctly.

### Manual Test

1. Visit: https://gymovaflow.com/forgot-password
2. Enter test email address
3. Check email inbox for reset link
4. If not received within 2 minutes, check:
   - Resend dashboard for failures
   - Server logs for errors
   - Email spam/junk folder

## Email Templates

Each email template is in `lib/email/templates/`:

- `verification.ts` - Email verification code
- `welcome.ts` - Welcome email for new clients
- `reset-password.ts` - Password reset link
- `trainer-application.ts` - Trainer approval/rejection

All templates use the `wrapEmail()` wrapper from `_base.ts` for consistent styling.

## Resend Pricing & Limits

- **Free Plan**: 100 emails/day, limited to verified senders only
- **Paid Plans**: Unlimited emails, 24/7 support

## Additional Resources

- Resend Documentation: https://resend.com/docs
- Domain Verification: https://resend.com/docs/dashboard/domains
- API Reference: https://resend.com/docs/api-reference/send-email
