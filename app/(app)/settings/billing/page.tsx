import { Suspense } from "react";

import { SettingsBillingContent } from "@/components/settings-billing-content";

export default function SettingsBillingPage() {
  return (
    <Suspense fallback={<section className="gp-settings-panel">Loading billing…</section>}>
      <SettingsBillingContent />
    </Suspense>
  );
}
