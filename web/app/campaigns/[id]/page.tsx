export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Campaign</h1>
      <p className="muted">ID: {params.id}</p>
      <div className="card">
        <h2>Transparency</h2>
        <ul className="clean">
          <li>Raised, fees, payouts with dates</li>
          <li>Payee is verified organization only</li>
          <li>Impact reports within 60 days</li>
          <li>Does not count toward Rally Score</li>
        </ul>
        <button className="btn" type="button">Donate</button>
      </div>
    </div>
  );
}
