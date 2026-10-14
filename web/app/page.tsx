export default function HomePage() {
  return (
    <div>
      <section style={{ textAlign: 'center', padding: 'clamp(1.5rem, 5vw, 3rem) 0' }}>
        <p className="badge" style={{ marginBottom: 12 }}>Fan support platform</p>
        <h1>Support the Favorites you love</h1>
        <p className="muted" style={{ margin: '1rem auto 1.75rem', maxWidth: 480 }}>
          Tokens, Gifts, Moments, verified charity, and live sessions — sky-clear support without algorithm gatekeeping.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <a className="btn" href="/explore">Explore Favorites</a>
          <a className="btn btn-ghost" href="/how-to-use">How it works</a>
        </div>
      </section>
      <div className="grid grid-2">
        <div className="card">
          <h2>Gifts & Tokens</h2>
          <p className="muted">Paystack · Flutterwave · Stripe via provider layer</p>
        </div>
        <div className="card">
          <h2>KYC</h2>
          <p className="muted">Smile Identity · Sumsub for verified Favorites</p>
        </div>
        <div className="card">
          <h2>Live</h2>
          <p className="muted">LiveKit / Agora rooms + live tipping</p>
        </div>
        <div className="card">
          <h2>Languages</h2>
          <p className="muted">en fr es pt ar + regional · RTL ready</p>
        </div>
      </div>
      <div className="card">
        <h2>Demo</h2>
        <a className="btn" href="/f/mia">Open @mia →</a>
      </div>
    </div>
  );
}
