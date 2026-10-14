'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

type FavoriteData = {
  favorite: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    coverUrl?: string;
    supporterCount: number;
    verificationStatus: string;
  };
  supporterWall: {
    recent: Array<{
      sender: { handle: string; displayName: string };
      message?: string;
      tokenCost: number;
      createdAt: string;
    }>;
  };
};

type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  tokenCost: number;
  type: string;
};

export default function FavoritePage() {
  const params = useParams();
  const handle = params.handle as string;
  const [data, setData] = useState<FavoriteData | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    api<FavoriteData>(`/api/favorites/${handle}`)
      .then(setData)
      .catch((e) => setError(e.message));
    api<{ items: CatalogItem[] }>('/api/gifts/catalog')
      .then((r) => setCatalog(r.items))
      .catch(() => {});
  }, [handle]);

  async function sendGift() {
    if (!selected) return;
    setStatus('sending');
    try {
      const token = localStorage.getItem('rally_token');
      if (!token) {
        setError('Please log in first');
        setStatus('error');
        return;
      }
      await api('/api/gifts/send', {
        method: 'POST',
        token,
        body: JSON.stringify({
          favoriteHandle: handle,
          catalogItemId: selected,
          message: message || undefined,
        }),
      });
      setStatus('sent');
      setMessage('');
      // refresh wall
      const refreshed = await api<FavoriteData>(`/api/favorites/${handle}`);
      setData(refreshed);
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }

  if (error && !data) {
    return <div className="card"><p>{error}</p></div>;
  }
  if (!data) {
    return <div className="muted">Loading…</div>;
  }

  const { favorite, supporterWall } = data;

  return (
    <div>
      <div className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <div className="avatar" />
        <div>
          <h1>
            {favorite.displayName}{' '}
            {favorite.verificationStatus === 'VERIFIED' && (
              <span style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>✓</span>
            )}
          </h1>
          <p className="muted">@{favorite.handle}</p>
          {favorite.bio && <p style={{ marginTop: '0.5rem' }}>{favorite.bio}</p>}
          <p className="muted" style={{ marginTop: '0.35rem' }}>
            {favorite.supporterCount} supporters
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Send a Gift</h2>
        <div className="gift-grid">
          {catalog.map((g) => (
            <div
              key={g.id}
              className={`gift-item ${selected === g.id ? 'selected' : ''}`}
              onClick={() => setSelected(g.id)}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                {g.slug === 'heart' ? '❤️' : g.slug === 'clap' ? '👏' : g.slug === 'flame' ? '🔥' : '🎁'}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{g.name}</div>
              <div className="muted">{g.tokenCost} tokens</div>
            </div>
          ))}
        </div>
        <textarea
          placeholder="Add a message (optional, max 280)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={280}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            resize: 'vertical',
            minHeight: 60,
          }}
        />
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn" disabled={!selected || status === 'sending'} onClick={sendGift}>
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : 'Send Gift'}
          </button>
          {status === 'error' && <span style={{ color: '#f87171' }}>{error}</span>}
        </div>
      </div>

      <div className="card">
        <h2>Supporter Wall</h2>
        {supporterWall.recent.length === 0 && (
          <p className="muted">Be the first to support {favorite.displayName}</p>
        )}
        {supporterWall.recent.map((s, i) => (
          <div
            key={i}
            style={{
              padding: '0.75rem 0',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>@{s.sender.handle}</strong>
              {s.message && <p className="muted">{s.message}</p>}
            </div>
            <span className="muted">{s.tokenCost} tok</span>
          </div>
        ))}
      </div>
    </div>
  );
}
