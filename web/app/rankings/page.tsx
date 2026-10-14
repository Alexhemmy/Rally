export default function RankingsPage() {
  return (
    <div>
      <h1>Rankings</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        By category and country. Rally Score balances reach, growth, loyalty, engagement — not pure spend (PRD §21).
      </p>
      <div className="card">
        <h2>Windows</h2>
        <div className="row">
          <span className="badge">Weekly</span>
          <span className="badge">Monthly</span>
          <span className="badge">All-time</span>
          <span className="badge">Rising</span>
          <span className="badge">Newcomers</span>
        </div>
      </div>
      <div className="card">
        <h2>Afrobeats · Rising</h2>
        <div className="list-row">
          <span>1. @mia</span>
          <a href="/f/mia">Open</a>
        </div>
        <p className="muted">Cohorts: Rising · Established · Legend. Opt-out available for Favorites.</p>
      </div>
    </div>
  );
}
