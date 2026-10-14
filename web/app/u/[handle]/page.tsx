export default function UserProfilePage({ params }: { params: { handle: string } }) {
  return (
    <div>
      <h1>@{params.handle}</h1>
      <p className="muted">Fan profile · badges · collections · Favorite upgrade progress (PRD §28)</p>
      <div className="card">
        <h2>Badges</h2>
        <div className="row">
          <span className="badge">Day One</span>
          <span className="badge">Streak</span>
        </div>
      </div>
      <div className="card">
        <h2>Favorite progress</h2>
        <p className="muted">Account age · published work · audience · engagement · standing</p>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, marginTop: 8 }}>
          <div style={{ width: '40%', height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}
