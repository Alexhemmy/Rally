'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function FavoritePage({ params }: { params: { handle: string } }) {
  const handle = params.handle;
  const [data, setData] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<any>(`/api/favorites/${handle}`),
      api<{ items: any[] }>('/api/gifts/catalog'),
    ])
      .then(([fav, cat]) => {
        setData(fav);
        setCatalog(cat.items || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [handle]);

  async function sendGift() {
    const token = getToken();
    if (!token) {
      setError('Log in to send gifts');
      return;
    }
    if (!selected) return;
    try {
      await api('/api/gifts/send', {
        method: 'POST',
        token,
        body: JSON.stringify({
          favoriteHandle: handle,
          catalogItemId: selected,
          message: message || undefined,
        }),
      });
      setStatus('Gift sent!');
      const fav = await api<any>(`/api/favorites/${handle}`);
      setData(fav);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error && !data) {
    return (
      <div className="card">
        <p className="error">{error}</p>
        <a href="/explore">Explore</a>
      </div>
    );
  }

  const fav = data?.favorite;
  if (!fav) return <p className="error">Favorite not found</p>;

  return (
    <div>
      <div className="card">
        <span className="badge">{fav.verificationStatus || 'profile'}</span>
        <h1 style={{ marginTop: 8 }}>{fav.displayName}</h1>
        <p className="muted">@{fav.handle}</p>
        {fav.bio && <p style={{ marginTop: 8 }}>{fav.bio}</p>}
        <p className="muted">{fav.supporterCount} supporters</p>
        <div className="row" style={{ marginTop: 12 }}>
          <a className="btn btn-ghost" href={`/u/${fav.handle}`}>Fan profile</a>
          <a className="btn btn-ghost" href="/live">Live</a>
        </div>
      </div>

      <div className="card">
        <h2>Send a Gift</h2>
        <div className="gift-grid">
          {catalog.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`gift-item ${selected === g.id ? 'selected' : ''}`}
              onClick={() => setSelected(g.id)}
            >
              <div>{g.name}</div>
              <div className="muted">{g.tokenCost} tok</div>
            </button>
          ))}
        </div>
        {catalog.length === 0 && <p className="muted">Start API + seed for gift catalog</p>}
        <label style={{ marginTop: 12 }}>Message</label>
        <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={280} />
        <button className="btn" type="button" onClick={sendGift} disabled={!selected}>Send Gift</button>
        {status && <p className="success">{status}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Supporter wall</h2>
        {(data.supporterWall?.recent || []).map((g: any, i: number) => (
          <div key={i} className="list-row">
            <div>
              <strong>@{g.sender?.handle}</strong>
              {g.message && <p className="muted">{g.message}</p>}
            </div>
            <span className="muted">{g.tokenCost} tok</span>
          </div>
        ))}
        {(data.supporterWall?.recent || []).length === 0 && (
          <p className="muted">Be the first supporter</p>
        )}
      </div>
    </div>
  );
}
