import { MarketingNav } from "@/components/marketing-nav";
import { DocsShell } from "@/components/docs-shell";
import { SiteFooter } from "@/components/site-footer";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="gp-shell">
      <MarketingNav />
      <DocsShell>{children}</DocsShell>
      <SiteFooter />
    </main>
  );
}
