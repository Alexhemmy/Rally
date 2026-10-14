export default function ExplorePage() {
  const categories = [
    'Music', 'Sports', 'Comedy', 'Film & TV', 'Gaming', 'Artisans',
    'Writers', 'Influencers', 'Dance', 'Food', 'Public life',
  ];
  return (
    <div>
      <h1>Explore</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Browse by industry, category, country, and rising Favorites.</p>
      <div className="card">
        <h2>Categories</h2>
        <div className="grid grid-2">
          {categories.map((c) => (
            <a key={c} href={`/search?category=${encodeURIComponent(c)}`} className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
              {c}
            </a>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>Featured</h2>
        <div className="list-row">
          <div>
            <strong>Mia the Emerging Artist</strong>
            <p className="muted">@mia · Afrobeats · Verified</p>
          </div>
          <a className="btn" href="/f/mia">View</a>
        </div>
      </div>
      <div className="row">
        <a className="btn btn-ghost" href="/rankings">Rankings</a>
        <a className="btn btn-ghost" href="/rivalries">Rivalries</a>
        <a className="btn btn-ghost" href="/search">Search</a>
      </div>
    </div>
  );
}
