export default function HomePage() {
  return (
    <div>
      <section style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h1>Support the Favorites you love</h1>
        <p className="muted" style={{ margin: '1rem 0 2rem', maxWidth: 480, marginInline: 'auto' }}>
          Tips became Gifts. Send a Heart, a Flame, or a signature gift in under 30 seconds.
          Your loyalty is seen.
        </p>
        <a className="btn" href="/f/mia">See Mia&apos;s page →</a>
      </section>

      <div className="card">
        <h2>How it works</h2>
        <ol style={{ paddingLeft: '1.25rem', color: 'var(--muted)' }}>
          <li>Buy Tokens with card, bank, or mobile money</li>
          <li>Pick a Gift from the catalog</li>
          <li>Send it — your Favorite sees it on their wall</li>
          <li>Earn badges and climb supporter levels</li>
        </ol>
      </div>
    </div>
  );
}
