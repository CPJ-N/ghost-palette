export default function SettingsProvidersPage() {
  return (
    <section className="gp-settings-panel">
      <h2>Providers</h2>
      <p className="gp-settings-copy">
        Ghost Palette routes generation through fal.ai. Server-side keys stay in
        environment variables for now; per-user provider keys arrive with
        persisted runs.
      </p>
      <dl className="gp-settings-dl">
        <div>
          <dt>Primary provider</dt>
          <dd>fal.ai</dd>
        </div>
        <div>
          <dt>Server key</dt>
          <dd className="gp-mono">FAL_KEY (env)</dd>
        </div>
        <div>
          <dt>Models in rotation</dt>
          <dd>FLUX, SD 3.5, Ideogram, and more via lib/models</dd>
        </div>
      </dl>
      <p className="gp-settings-note">
        Bring-your-own-key support is planned for teams comparing private model
        endpoints alongside hosted defaults.
      </p>
    </section>
  );
}
