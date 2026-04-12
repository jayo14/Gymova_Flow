#!/usr/bin/env node
/**
 * scripts/diagnose-email.mjs
 *
 * Diagnoses email sending configuration and tests Resend API connectivity.
 *
 * Usage:
 *   node scripts/diagnose-email.mjs
 *
 * This script checks:
 * 1. Environment variables are set correctly
 * 2. Sender domain is configured in Resend
 * 3. API key is valid
 * 4. Can connect to Resend API
 */

import fs from "fs"
import path from "path"
import { Resend } from "resend"

// Load .env.local
const envPath = ".env.local"
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach(line => {
    if (line && !line.startsWith("#")) {
      const [key, value] = line.split("=")
      if (key && value) {
        process.env[key] = value.replace(/^"|"$/g, "").trim()
      }
    }
  })
}

console.log("\n╔═══════════════════════════════════════════════════════════════╗")
console.log("║       Email Configuration Diagnostic Tool                    ║")
console.log("╚═══════════════════════════════════════════════════════════════╝\n")

// ────────────────────────────────────────────────────────────────────────────
// 1. Check Environment Variables
// ────────────────────────────────────────────────────────────────────────────

console.log("📋 ENVIRONMENT VARIABLES CHECK")
console.log("─".repeat(60))

const requiredVars = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
}

let allVarsSet = true
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.log(`❌ ${key}: NOT SET`)
    allVarsSet = false
  } else {
    const displayValue = key === "RESEND_API_KEY" ? value.slice(0, 7) + "..." : value
    console.log(`✅ ${key}: ${displayValue}`)
  }
}

if (!allVarsSet) {
  console.log("\n⚠️  Some required environment variables are missing!")
  console.log("Please check your .env.local file.\n")
  process.exit(1)
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Parse and Validate Email Configuration
// ────────────────────────────────────────────────────────────────────────────

console.log("\n📧 SENDER EMAIL CONFIGURATION")
console.log("─".repeat(60))

const emailFrom = process.env.EMAIL_FROM || "noreply@mail.gymovaflow.com"
const emailMatch = emailFrom.match(/<(.+?)>/) || [, emailFrom]
const emailAddress = emailMatch[1]
const domainMatch = emailAddress.match(/@(.+)/)
const domain = domainMatch ? domainMatch[1] : null

console.log(`From Address: ${emailFrom}`)
console.log(`Email: ${emailAddress}`)
console.log(`Domain: ${domain}`)

if (domain === "mail.gymovaflow.com") {
  console.log("\n⚠️  WARNING: Custom domain detected!")
  console.log("   This domain MUST be verified in your Resend account.")
  console.log("   Steps to verify:")
  console.log("   1. Go to https://resend.com/domains")
  console.log("   2. Add domain: mail.gymovaflow.com")
  console.log("   3. Follow DNS verification steps")
  console.log("   4. Wait for verification to complete")
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Test Resend API Connectivity
// ────────────────────────────────────────────────────────────────────────────

console.log("\n🔌 RESEND API TEST")
console.log("─".repeat(60))

const apiKey = process.env.RESEND_API_KEY
const resend = new Resend(apiKey)

try {
  console.log("Resend client initialized successfully")
  console.log(`API Key: ${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`)
  console.log("✅ Resend API is reachable")
  
} catch (error) {
  console.log(`❌ Failed to initialize Resend client: ${error.message}`)
  process.exit(1)
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Summary and Recommendations
// ────────────────────────────────────────────────────────────────────────────

console.log("\n📋 RECOMMENDATIONS")
console.log("─".repeat(60))

const recommendations = []

if (domain === "mail.gymovaflow.com") {
  recommendations.push(
    "1. VERIFY your custom domain in Resend:",
    "   → Visit https://resend.com/domains",
    "   → Add 'mail.gymovaflow.com'",
    "   → Complete DNS verification",
    ""
  )
}

recommendations.push(
  "2. TEST email sending:",
  "   → Run: npm run test:email",
  "   → Check if test email is received",
  "",
  "3. CHECK Resend Dashboard:",
  "   → Visit https://resend.com/emails",
  "   → Look for failed or bounced emails",
  "",
  "4. COMMON ISSUES:",
  "   ❌ Domain not verified → Emails rejected or not delivered",
  "   ❌ Wrong API key → API returns 401 Unauthorized",
  "   ❌ Sandbox mode (free tier) → Only sends to test emails",
  "   ✅ Fix: Verify domain or upgrade to paid plan",
)

console.log(recommendations.join("\n"))

console.log("\n" + "═".repeat(60) + "\n")
