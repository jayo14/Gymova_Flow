import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Dumbbell, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms and Conditions | GymovaFlow",
  description: "Terms and conditions for using the GymovaFlow platform.",
}

export default function TermsPage() {
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
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <span className="text-primary font-semibold tracking-wider uppercase text-xs">Legal</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-primary max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the GymovaFlow platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">2. Use of License</h2>
            <p className="text-muted-foreground leading-relaxed">
              Permission is granted to temporarily download one copy of the materials on GymovaFlow&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Modify or copy the materials;</li>
              <li>Use the materials for any commercial purpose or for any public display;</li>
              <li>Attempt to decompile or reverse engineer any software contained on the website;</li>
              <li>Remove any copyright or other proprietary notations from the materials;</li>
              <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">3. Platform Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              GymovaFlow is a marketplace connecting independent fitness professionals (&quot;Trainers&quot;) with clients (&quot;Users&quot;). GymovaFlow does not provide fitness training directly and is not responsible for the conduct, safety, or quality of sessions provided by independent Trainers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">4. Trainer & User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use certain features of the platform, you must register for an account. You represent and warrant that all information you provide is accurate and complete. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">5. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials on GymovaFlow&apos;s website are provided on an &apos;as is&apos; basis. GymovaFlow makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">6. Limitations</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall GymovaFlow or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GymovaFlow&apos;s website.
            </p>
          </section>

          <section className="pt-8 border-t border-white/5">
            <h2 className="text-2xl font-bold mb-4 text-white">Questions?</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about these Terms, please contact us.
            </p>
            <Link 
              href="mailto:legal@gymovaflow.com" 
              className="inline-flex h-12 items-center justify-center px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all font-medium"
            >
              Contact Legal Team
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
