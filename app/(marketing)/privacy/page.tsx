import type { Metadata } from "next";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Ghost Palette",
  description: "How Ghost Palette collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    url: "/privacy",
    title: "Privacy Policy — Ghost Palette",
    description: "How Ghost Palette collects, uses, and protects your information.",
  },
};

const LAST_UPDATED = "June 30, 2026";

export default function PrivacyPage() {
  return (
    <main className="gp-shell">
      <MarketingNav />
      <article className="gp-legal-page">
        <header className="gp-legal-page__head">
          <p className="gp-kicker">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="gp-legal-page__updated">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="gp-legal-section">
          <p>
            This Privacy Policy explains what information Ghost Palette
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects when
            you use the Service, how we use it, and the choices you have. It applies
            to everyone who creates an account or otherwise uses Ghost Palette.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>1. Information We Collect</h2>
          <p>
            <strong>Account information.</strong> When you sign up, our
            authentication provider (Clerk) collects your email address, name, and
            (optionally) a profile image, and manages sign-in.
          </p>
          <p>
            <strong>Generations.</strong> Every prompt you submit and every image or
            video you generate is stored in your account automatically, so it
            appears in your Gallery. This includes the prompt text, the model used,
            generation settings (such as seed and dimensions), and the resulting
            media file. You can delete a generation at any time from the Gallery.
          </p>
          <p>
            <strong>Reference images.</strong> If you upload a reference image for
            the Refine workflow, it&rsquo;s sent to the selected AI model provider to
            generate output; it is not separately stored by us beyond what&rsquo;s
            needed to complete that request.
          </p>
          <p>
            <strong>Billing information.</strong> If you purchase credits or
            subscribe to a paid plan, our payment processor (Stripe) collects your
            payment details directly. We receive and store your subscription status,
            plan, and credit balance — never your full card number.
          </p>
          <p>
            <strong>Usage and technical data.</strong> We and our infrastructure
            providers automatically log technical information such as IP address,
            browser type, device information, and request timestamps, primarily for
            security, debugging, and abuse prevention.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>2. How We Use Information</h2>
          <ul>
            <li>To operate the Service — authenticate you, run generations, and show you your Gallery;</li>
            <li>To process payments and manage your credit balance and subscription;</li>
            <li>To communicate with you about your account, transactions, or changes to our policies;</li>
            <li>To detect, prevent, and respond to fraud, abuse, and security issues; and</li>
            <li>To maintain and improve the reliability and performance of the Service.</li>
          </ul>
          <p>
            We do not use your prompts or generated content to train AI models we
            operate, and we do not sell your personal information.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>3. Who We Share Information With</h2>
          <p>
            We share information only with the service providers (&ldquo;processors&rdquo;)
            that help us operate Ghost Palette, each bound to use it only to provide
            their service to us:
          </p>
          <ul>
            <li><strong>Clerk</strong> — authentication and account management;</li>
            <li><strong>Supabase</strong> — database and storage for your generations and account data;</li>
            <li><strong>Stripe</strong> — payment processing and subscription billing;</li>
            <li><strong>fal.ai (and other integrated AI model providers)</strong> — performing the image/video generation you request, which requires sending the relevant prompt and reference image to that provider;</li>
            <li><strong>Resend</strong> — delivering transactional emails (e.g., receipts, account notices); and</li>
            <li><strong>Vercel</strong> — application hosting and infrastructure.</li>
          </ul>
          <p>
            We may also disclose information if required by law, to protect our
            rights or the safety of others, or in connection with a merger,
            acquisition, or sale of assets (with notice to you where required).
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>4. Cookies</h2>
          <p>
            We use a session cookie set by our authentication provider (Clerk) that
            is strictly necessary to keep you signed in — the Service can&rsquo;t
            function without it. We do not currently use advertising or third-party
            tracking cookies. If that changes, we&rsquo;ll update this policy and, where
            required, ask for your consent first.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>5. Data Retention</h2>
          <p>
            We retain your generations until you delete them or close your account.
            We retain account and billing records for as long as your account is
            active, and afterward only as long as needed for legitimate business or
            legal purposes (e.g., tax and accounting records).
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>6. Your Rights and Choices</h2>
          <p>
            You can review and delete individual generations from your Gallery at
            any time. To access, export, correct, or delete your account and
            associated data, contact us at{" "}
            <a href="mailto:hello@ghostpalette.app">hello@ghostpalette.app</a>.
            Depending on where you live, you may have additional rights under laws
            such as the GDPR or CCPA, including the right to object to or restrict
            certain processing; we&rsquo;ll honor applicable requests consistent with
            those laws.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>7. Children&rsquo;s Privacy</h2>
          <p>
            Ghost Palette is not directed to, and we do not knowingly collect
            personal information from, anyone under 18. If you believe a minor has
            provided us information, contact us and we will delete it.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>8. International Data Transfers</h2>
          <p>
            Our service providers may process and store information in countries
            other than your own. Where required, we rely on appropriate safeguards
            (such as standard contractual clauses) for these transfers.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>9. Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect your
            information, including encrypted connections and access controls. No
            method of transmission or storage is completely secure, and we
            can&rsquo;t guarantee absolute security.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We&rsquo;ll update the
            &ldquo;Last updated&rdquo; date above and, for material changes,
            provide additional notice.
          </p>
        </section>

        <section className="gp-legal-section">
          <h2>11. Contact</h2>
          <p>
            Questions about this Privacy Policy or your data? Email{" "}
            <a href="mailto:hello@ghostpalette.app">hello@ghostpalette.app</a>.
          </p>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
