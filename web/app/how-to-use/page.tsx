export default function HowToUsePage() {
  return (
    <div>
      <h1>How to use Rally</h1>
      <div className="card">
        <h2>Fans</h2>
        <ol className="clean" style={{ listStyle: 'decimal' }}>
          <li>Create an account (or guest tip where allowed)</li>
          <li>Buy a Token pack with card, bank, or mobile money</li>
          <li>Open a Favorite page or Moment and send a Gift</li>
          <li>Earn badges and climb supporter levels</li>
          <li>Join fan clubs, campaigns, and communities as they roll out</li>
        </ol>
      </div>
      <div className="card">
        <h2>Favorites</h2>
        <ol className="clean" style={{ listStyle: 'decimal' }}>
          <li>Apply, verify, connect payout</li>
          <li>Publish page and share kit (link, QR)</li>
          <li>Post Moments; receive Gift Points; cash out</li>
          <li>Optional: charity campaigns to verified orgs only</li>
        </ol>
      </div>
      <a className="btn" href="/register">Get started</a>
    </div>
  );
}
