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
            Compare, generate, and evaluate across every leading image model —
            in one workspace.
          </p>
          <Link
            className="gp-button gp-button--ghost gp-sitefooter__cta"
            href="/composer"
          >
            Open the app
          </Link>
        </div>

        <nav className="gp-sitefooter__cols" aria-label="Footer">
          <div>
            <p>Product</p>
            <Link href="/composer">Composer</Link>
            <Link href="/arena">Arena</Link>
            <Link href="/evals">Evals</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div>
            <p>Account</p>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/sign-up">Create account</Link>
          </div>
          <div>
            <p>Company</p>
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
