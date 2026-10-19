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
        <a href="/rankings">Rankings</a>
        <a href="/city-rankings">City lanes</a>
        <a href="/giveaways">Giveaways</a>
        <a href="/rivalries">Rivalries</a>
        <a href="/live">Live</a>
        <a href="/store">Store</a>
        <a href="/merch">Merch</a>
        <a href="/predictions">Predictions</a>
        <a href="/subscriptions">Fan Clubs</a>
        <a href="/fangifts">Fan Gifts</a>
        <a href="/collections">Collections</a>
        <a href="/wallet">Wallet</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/junior">Junior Favorites</a>
        <a href="/sponsors">Brands</a>
        <a href="/upgrade">Become a Favorite</a>
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
