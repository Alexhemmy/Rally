'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function DashboardPage() {
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { setError('Log in as a Favorite'); return; }
    api<{ user: any }>('/api/auth/me', { token })
      .then((r) => setMe(r.user))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Favorite dashboard</h1>
      {error && <p className="error">{error}</p>}
      {me && (
        <div className="card">
          <p><strong>{me.displayName}</strong> · @{me.handle}</p>
          <p className="muted">Gift Points: {me.favoriteProfile?.giftPointsBalance ?? '—'}</p>
        </div>
      )}
      <div className="grid grid-2">
        <a className="card" href="/dashboard/earnings" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Earnings & payouts</h2>
          <p className="muted">Balance, history, withdraw</p>
        </a>
        <a className="card" href="/f/mia" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>Public page</h2>
          <p className="muted">Preview & share</p>
        </a>
        <div className="card">
          <h2>Moments</h2>
          <p className="muted">Post highlights in under 30s</p>
        </div>
        <div className="card">
          <h2>Team</h2>
          <p className="muted">Managers & moderators</p>
        </div>
        <div className="card">
          <h2>Campaigns</h2>
          <p className="muted">Verified charity only</p>
        </div>
        <div className="card">
          <h2>Verification</h2>
          <p className="muted">ID + social proof</p>
        </div>
      </div>
    </div>
  );
}
