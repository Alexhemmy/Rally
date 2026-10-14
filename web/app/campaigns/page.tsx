export default function CampaignsPage() {
  return (
    <div>
      <h1>Charity campaigns</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Funds go only to verified beneficiaries — never to Favorites (PRD §25).
      </p>
      <div className="card">
        <h2>Open causes</h2>
        <div className="list-row">
          <div>
            <strong>School supplies drive</strong>
            <p className="muted">Education · verified NGO</p>
          </div>
          <a className="btn" href="/campaigns/demo">View</a>
        </div>
      </div>
      <a className="btn btn-ghost" href="/dashboard">Start a campaign (Favorites)</a>
    </div>
  );
}
