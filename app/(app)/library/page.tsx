export default function LibraryPage() {
  return (
    <div className="gp-feature">
      <header className="gp-feature__head">
        <span className="gp-tag">Library</span>
        <h1>Your runs</h1>
        <p>
          Saved generations and favorites will live here once accounts and
          persistence are turned on.
        </p>
      </header>
      <div className="gp-listempty">
        Nothing saved yet — the Library activates with Supabase persistence.
      </div>
    </div>
  );
}
