import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Dumbbell, Lock } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | GymovaFlow",
  description: "Privacy policy describing how we collect, use, and protect your data at GymovaFlow.",
}

export default function PrivacyPage() {
  const lastUpdated = "April 12, 2026"

  return (
    <div className="min-h-screen bg-[#0d0d12] text-[#f9f9f9] selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#0d0d12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(163,230,21,0.3)] group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">Gymova</span>Flow
            </span>
          </Link>
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <span className="text-primary font-semibold tracking-wider uppercase text-xs">Privacy</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-primary max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us when you create an account, update your profile, book a session, or communicate with us. This includes:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Name, email address, and phone number;</li>
              <li>Profile information including fitness goals and preferences;</li>
              <li>Payment information (processed securely by our third-party processors);</li>
              <li>Messages and communications within the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Facilitate bookings and communication between Users and Trainers;</li>
              <li>Personalize your experience with AI-powered trainer recommendations;</li>
              <li>Send transaction notifications and administrative messages;</li>
              <li>Improve and optimize our platform services;</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>With Trainers or Users to facilitate bookings you have initiated;</li>
              <li>With third-party service providers who perform services for us (e.g., payment processing, email delivery);</li>
              <li>To comply with a legal request or prevent harm;</li>
              <li>With your explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We take reasonable measures to protect your personal information from loss, theft, misuse, and unauthorized access. However, no internet transmission is ever 100% secure or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Your Choices</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may update or correct your account information at any time by logging into your account settings. You may also request deletion of your account and personal information by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. Changes to this Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, providing additional notice.
            </p>
          </section>

          <section className="pt-8 border-t border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-white">Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions or concerns regarding your privacy at GymovaFlow, please reach out.
            </p>
            <Link 
              href="mailto:privacy@gymovaflow.com" 
              className="inline-flex h-12 items-center justify-center px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all font-medium"
            >
              Contact Data Protection Officer
            </Link>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 bg-[#0a0a0f]">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GymovaFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
