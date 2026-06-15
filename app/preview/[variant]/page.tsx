import { notFound } from "next/navigation";

import { ThemePreview } from "@/components/theme-preview";
import { getTheme, PREVIEW_IDS } from "@/lib/preview-themes";

export function generateStaticParams() {
  return PREVIEW_IDS.map((variant) => ({ variant }));
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (!getTheme(variant)) {
    notFound();
  }
  return <ThemePreview variant={variant} />;
}
