'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type Giveaway = {
  id: string;
  favoriteId: string;
  favoriteName: string | null;
  poolAmount: number;
  currency: string;
  winnerCount: number;
  entryOpensAt: string;
  entryClosesAt: string;
  status: string;
};

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ giveaways: Giveaway[] }>('/api/giveaways', { skipAuth: true });
      setGiveaways(r.giveaways || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load giveaways');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function enter(id: string) {
    setErr(''); setMsg('');
    try {
      await api(`/api/giveaways/${id}/enter`, { method: 'POST' });
      setMsg('You are in! Winners are weighted by activeness, dedication and passion — never by spend.');
    } catch (e: any) {
      setErr(e.message || 'Could not enter');
    }
  }

  return (
    <div>
      <h1>Giveaways</h1>
      <p className="muted">
        Free entry. Weighted by activeness, dedication, passion — never by spend (PRD §29).
        Provable fairness: the draw seed hash is published at announce and revealed at draw.
      </p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {loading && <p className="muted">Loading…</p>}
      {!loading && giveaways.length === 0 && (
        <div className="card">
          <p className="muted">No open giveaways right now. Favorites fund escrow before announcing.</p>
        </div>
      )}
      {giveaways.map((g) => {
        const open = new Date(g.entryClosesAt) > new Date() && g.status === 'announced';
        return (
          <div className="card" key={g.id}>
            <h2>{g.favoriteName || 'A Favorite'} · Giveaway</h2>
            <p>
              <span className="badge">{g.poolAmount} {g.currency} pool</span>{' '}
              <span className="badge">{g.winnerCount} winner{g.winnerCount > 1 ? 's' : ''}</span>{' '}
              <span className="badge">{g.status}</span>
            </p>
            <p className="muted">
              Entries close {new Date(g.entryClosesAt).toLocaleString()}.
              No purchase necessary — every eligible fan can enter.
            </p>
            <div className="row">
              <a className="btn btn-ghost" href={`/giveaways/${g.id}`}>View</a>
              {open && authed && (
                <button className="btn" onClick={() => enter(g.id)}>Enter for free</button>
              )}
              {open && !authed && <a className="btn" href="/login">Log in to enter</a>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
