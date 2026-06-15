import { AppNav } from "@/components/app-nav";

// Routes here are gated by proxy.ts (Clerk auth.protect). This shell wraps every
// authed feature in the persistent side-rail.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="gp-app">
      <AppNav />
      <main className="gp-appmain">{children}</main>
    </div>
  );
}
