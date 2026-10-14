'use client';

export function Nav() {
  return (
    <header className="header">
      <a href="/" className="logo">Rally</a>
      <nav className="nav">
        <a href="/explore">Explore</a>
        <a href="/feed">Feed</a>
        <a href="/rankings">Rankings</a>
        <a href="/campaigns">Campaigns</a>
        <a href="/wallet">Wallet</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
        <a href="/login">Log in</a>
      </nav>
    </header>
  );
}
