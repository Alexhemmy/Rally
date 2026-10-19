'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type FaceOff = {
  id: string; question: string; favoriteAId: string; favoriteBId: string;
  votesA: number; votesB: number; closesAt: string;
};
type Rivalry = {
  id: string;
  favoriteA: { id: string; name: string | null };
  favoriteB: { id: string; name: string | null };
  status: string; heatLevel: number; summary: string | null;
  optInA: boolean; optInB: boolean;
  faceOffs: FaceOff[];
};

export default function RivalriesPage() {
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    try {
      const r = await api<{ rivalries: Rivalry[] }>('/api/rivalries', { skipAuth: true });
      setRivalries(r.rivalries || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load rivalries');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function vote(faceOffId: string, side: 'A' | 'B') {
    setErr('');
    try {
      await api(`/api/rivalries/faceoffs/${faceOffId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ side }),
      });
      load();
    } catch (e: any) {
      setErr(e.message || 'Vote failed');
    }
  }

  return (
    <div>
      <h1>Rivalries</h1>
      <p className="muted">
        Opt-in, moderated energy without harm. Beef Radar de-escalates heat (PRD §20).
        No money wagering — ever.
      </p>
      {err && <p className="error">{err}</p>}
      {rivalries.length === 0 && (
        <div className="card"><p className="muted">No rivalries documented yet. Admins record sourced rivalries only — nothing is fabricated.</p></div>
      )}
      {rivalries.map((r) => (
        <div className="card" key={r.id}>
          <h2>{r.favoriteA.name || 'Favorite A'} vs {r.favoriteB.name || 'Favorite B'}</h2>
          <p>
            <span className="badge">{r.status}</span>{' '}
            <span className="badge">🔥 Beef Radar {r.heatLevel}/5</span>
          </p>
          {r.summary && <p className="muted">{r.summary}</p>}
          {r.faceOffs.map((f) => {
            const total = f.votesA + f.votesB;
            const pctA = total ? Math.round((f.votesA / total) * 100) : 50;
            return (
              <div key={f.id} style={{ marginTop: '0.75rem' }}>
                <p><strong>{f.question}</strong></p>
                <p className="muted">
                  {r.favoriteA.name}: {f.votesA} ({pctA}%) · {r.favoriteB.name}: {f.votesB} ({100 - pctA}%)
                </p>
                {authed ? (
                  <div className="row">
                    <button className="btn" onClick={() => vote(f.id, 'A')}>Vote {r.favoriteA.name}</button>
                    <button className="btn btn-ghost" onClick={() => vote(f.id, 'B')}>Vote {r.favoriteB.name}</button>
                  </div>
                ) : (
                  <a className="btn btn-ghost" href="/login">Log in to vote</a>
                )}
              </div>
            );
          })}
          {r.faceOffs.length === 0 && (
            <p className="muted">No open face-offs. Interactive battles need both Favorites to opt in.</p>
          )}
        </div>
      ))}
    </div>
  );
}
