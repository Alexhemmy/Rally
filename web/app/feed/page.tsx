'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function FeedPage() {
  const [moments, setMoments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [chrono, setChrono] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Log in to see your home feed');
      return;
    }
    api<{ moments: any[] }>('/api/feed/home', { token })
      .then((r) => setMoments(r.moments || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>Home</h1>
        <button className="btn btn-ghost" type="button" onClick={() => setChrono(!chrono)}>
          {chrono ? 'Chronological' : 'Mixed'} ✓
        </button>
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>Moments from Favorites you follow. No paid boost mixed unlabeled.</p>
      {error && <div className="card"><p className="error">{error}</p><a href="/login">Log in</a></div>}
      {!error && moments.length === 0 && (
        <div className="card">
          <p className="muted">No Moments yet. Follow Favorites or open a demo page.</p>
          <a className="btn" href="/f/mia" style={{ marginTop: 8 }}>Open @mia</a>
        </div>
      )}
      {moments.map((m) => (
        <a key={m.id} href={`/moments/${m.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <span className="badge">{m.type}</span>
          <h2 style={{ marginTop: 8 }}>{m.title}</h2>
          <p className="muted">@{m.favorite?.user?.handle} · {m.supportCount} supports</p>
        </a>
      ))}
    </div>
  );
}
