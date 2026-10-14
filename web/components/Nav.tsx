'use client';

import { useEffect, useState } from 'react';
import { getToken, clearToken, isSessionActiveLocally } from '@/lib/session';

export function Nav() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken() && isSessionActiveLocally());
  }, []);

  return (
    <header className="header">
      <a href="/" className="logo">Rally</a>
      <nav className="nav" aria-label="Main">
        <a href="/explore">Explore</a>
        <a href="/feed">Feed</a>
        <a href="/search">Search</a>
        <a href="/rankings">Rankings</a>
        <a href="/campaigns">Campaigns</a>
        <a href="/live">Live</a>
        <a href="/wallet">Wallet</a>
        <a href="/notifications">Alerts</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/onboarding">Onboarding</a>
        <a href="/settings">Settings</a>
        {authed ? (
          <a
            href="/login"
            onClick={() => clearToken()}
          >
            Log out
          </a>
        ) : (
          <a href="/login">Log in</a>
        )}
      </nav>
    </header>
  );
}
