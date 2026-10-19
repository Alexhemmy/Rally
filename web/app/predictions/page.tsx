'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

type Prediction = {
  id: string;
  question: string;
  closesAt: string;
  prizeKind: string;
  tokenPrize: number;
  countryCode: string;
  status: string;
  favoriteAName: string;
  favoriteBName: string;
};

export default function PredictionsPage() {
  const [open, setOpen] = useState<Prediction[]>([]);
  const [settled, setSettled] = useState<Prediction[]>([]);
  const [legal, setLegal] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const o = await api<{ predictions: Prediction[] }>('/api/predictions?status=open', { skipAuth: true });
      setOpen(o.predictions || []);
      const s = await api<{ predictions: Prediction[] }>('/api/predictions?status=settled', { skipAuth: true });
      setSettled(s.predictions || []);
      const l = await api<{ countries: string[] }>('/api/predictions/legal', { skipAuth: true });
      setLegal(l.countries || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function enter(id: string, choice: string) {
    setErr(''); setMsg('');
    try {
      await api('/api/predictions/' + id + '/enter', { method: 'POST', body: JSON.stringify({ choice }) });
      setMsg('Prediction locked in!');
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h1>Predictions</h1>
      <p className="muted">
        Free head-to-head predictions with Token prizes where legal (markets: {legal.join(', ') || '—'}).
        Prize Tokens land in your gifted balance — spend on Gifts, never withdrawable. Minors are blocked.
      </p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {loading && <p className="muted">Loading…</p>}

      <div className="stack">
        {open.map((p) => (
          <div className="card" key={p.id}>
            <h2>{p.question}</h2>
            <p>
              <span className="badge">{p.favoriteAName} vs {p.favoriteBName}</span>{' '}
              {p.prizeKind === 'tokens' && <span className="badge">{p.tokenPrize} token prize</span>}{' '}
              <span className="badge">{p.countryCode}</span>
            </p>
            <p className="muted">Closes {new Date(p.closesAt).toLocaleString()}</p>
            {authed ? (
              <div className="row">
                <button className="btn" onClick={() => enter(p.id, 'a')}>Pick {p.favoriteAName}</button>
                <button className="btn" onClick={() => enter(p.id, 'b')}>Pick {p.favoriteBName}</button>
              </div>
            ) : (
              <a className="btn btn-ghost" href="/login">Log in to predict</a>
            )}
          </div>
        ))}
        {!loading && open.length === 0 && (
          <div className="card"><p className="muted">No open predictions right now.</p></div>
        )}
      </div>

      {settled.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>Recent results</h2>
          <div className="stack">
            {settled.slice(0, 10).map((p) => (
              <div className="card" key={p.id}>
                <p>{p.question}</p>
                <p className="muted">Settled {new Date(p.closesAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
