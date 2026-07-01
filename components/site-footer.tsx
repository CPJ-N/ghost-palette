import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="gp-sitefooter">
      <div className="gp-sitefooter__top">
        <div className="gp-sitefooter__brand">
          <Link href="/" className="gp-sitefooter__mark">
            <span className="gp-mark" aria-hidden="true">
              GP
            </span>
            <span>Ghost Palette</span>
          </Link>
          <p>
            Create, compare, and refine AI images with model scores and
            benchmark data close at hand.
          </p>
          <Link
            className="gp-button gp-button--ghost gp-sitefooter__cta"
            href="/leaderboard"
          >
            View model scores
          </Link>
        </div>

        <nav className="gp-sitefooter__cols" aria-label="Footer">
          <div>
            <p>Model intelligence</p>
            <Link href="/leaderboard">Model scores</Link>
            <Link href="/benchmark">Benchmarks</Link>
            <Link href="/docs/benchmarks">Model data</Link>
            <Link href="/docs/methodology">Methodology</Link>
          </div>
          <div>
            <p>Account</p>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/sign-up">Create account</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div>
            <p>Company</p>
            <Link href="/docs">Docs</Link>
            <a href="mailto:hello@ghostpalette.app">Contact</a>
          </div>
          <div>
            <p>Legal</p>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </nav>
      </div>

      <div className="gp-sitefooter__bottom">
        <span>© 2026 Ghost Palette</span>
        <span>All rights reserved</span>
        <span className="gp-sitefooter__legal-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
