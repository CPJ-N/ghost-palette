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
            Compare, benchmark, and evaluate image models — live ImageBench
            scores and industry reference data in one place.
          </p>
          <Link
            className="gp-button gp-button--ghost gp-sitefooter__cta"
            href="/leaderboard"
          >
            View live scores
          </Link>
        </div>

        <nav className="gp-sitefooter__cols" aria-label="Footer">
          <div>
            <p>Evaluate</p>
            <Link href="/leaderboard">Live leaderboard</Link>
            <Link href="/benchmark">Run suite</Link>
            <Link href="/docs/benchmarks">Industry benchmarks</Link>
            <Link href="/docs/methodology">Methodology</Link>
          </div>
          <div>
            <p>Workbench</p>
            <Link href="/arena">Arena</Link>
            <Link href="/evals">Refine</Link>
            <Link href="/library">Library</Link>
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
        </nav>
      </div>

      <div className="gp-sitefooter__bottom">
        <span>© 2026 Ghost Palette</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
}
