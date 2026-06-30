import { AppFrame } from "@/components/app-frame";

// Routes here are gated by proxy.ts for generation workflows. The shadcn sidebar is
// the workspace frame for Create, Refine, Gallery, and Settings.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppFrame>{children}</AppFrame>;
}
