"use client";

import { useUser } from "@clerk/nextjs";

export default function SettingsAccountPage() {
  const { user } = useUser();

  return (
    <section className="gp-settings-panel">
      <h2>Account</h2>
      <dl className="gp-settings-dl">
        <div>
          <dt>Name</dt>
          <dd>{user?.fullName ?? user?.firstName ?? "—"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.primaryEmailAddress?.emailAddress ?? "—"}</dd>
        </div>
        <div>
          <dt>User ID</dt>
          <dd className="gp-mono">{user?.id ?? "—"}</dd>
        </div>
      </dl>
      <p className="gp-settings-note">
        Profile edits and connected OAuth accounts will live here once the
        evaluation workspace syncs identity with saved runs.
      </p>
    </section>
  );
}
