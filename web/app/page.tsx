export default function HomePage() {
  return (
    <div>
      <section style={{ textAlign: 'center', padding: '2.5rem 0' }}>
        <h1>Support the Favorites you love</h1>
        <p className="muted" style={{ margin: '1rem auto 1.75rem', maxWidth: 480 }}>
          Buy Tokens, send Gifts, join Moments, fund verified causes, and earn recognition —
          without depending on algorithms alone.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <a className="btn" href="/explore">Explore Favorites</a>
          <a className="btn btn-ghost" href="/how-to-use">How it works</a>
        </div>
      </section>
      <div className="card">
        <h2>Core loops</h2>
        <ul className="clean">
          <li>Tokens → Gifts on pages, Moments, and live sessions</li>
          <li>Badges, supporter levels, and rankings (money does not buy rank alone)</li>
          <li>Charity campaigns to verified beneficiaries only</li>
          <li>Multi-language UI and translate controls</li>
        </ul>
      </div>
      <div className="card">
        <h2>Try the demo</h2>
        <p className="muted">Favorite page with gift wall:</p>
        <a className="btn" href="/f/mia" style={{ marginTop: 8 }}>Open @mia →</a>
      </div>
    </div>
  );
}
