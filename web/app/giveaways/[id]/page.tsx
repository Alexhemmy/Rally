'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type Detail = {
  giveaway: {
    id: string; favoriteId: string; poolAmount: number; currency: string;
    winnerCount: number; split: string; entryOpensAt: string; entryClosesAt: string;
    status: string; seedHash: string | null; seedRevealed: string | null; entryCount: number;
  };
};

type Results = {
  giveaway: { id: string; status: string };
  winners: { rank: number | null; displayName: string; handle: string | null }[] | null;
  own: { entered: boolean; isWinner: boolean; isAlternate: boolean; rank: number | null; scoreBand: string | null } | null;
};

export default function GiveawayDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail['giveaway'] | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    try {
      const d = await api<Detail>(`/api/giveaways/${params.id}`, { skipAuth: true });
      setDetail(d.giveaway);
      const r = await api<Results>(`/api/giveaways/${params.id}/results`, { skipAuth: !authed });
      setResults(r);
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    }
  }, [params.id, authed]);

  useEffect(() => { load(); }, [load]);

  async function act(path: string, okMsg: string) {
    setErr(''); setMsg('');
    try {
      await api(`/api/giveaways/${params.id}/${path}`, { method: 'POST' });
      setMsg(okMsg);
      load();
    } catch (e: any) {
      setErr(e.message || 'Action failed');
    }
  }

  if (!detail) return <div><h1>Giveaway</h1>{err && <p className="error">{err}</p>}<p className="muted">Loading…</p></div>;

  const open = new Date(detail.entryClosesAt) > new Date() && detail.status === 'announced';
  return (
    <div>
      <h1>Giveaway · {detail.poolAmount} {detail.currency}</h1>
      <div className="card">
        <p>
          <span className="badge">{detail.status}</span>{' '}
          <span className="badge">{detail.winnerCount} winner{detail.winnerCount > 1 ? 's' : ''}</span>{' '}
          <span className="badge">{detail.split} split</span>{' '}
          <span className="badge">{detail.entryCount} entered</span>
        </p>
        <p className="muted">
          Entry window: {new Date(detail.entryOpensAt).toLocaleString()} → {new Date(detail.entryClosesAt).toLocaleString()}
        </p>
        {msg && <p className="success">{msg}</p>}
        {err && <p className="error">{err}</p>}
        {open && authed && (
          <div className="row">
            <button className="btn" onClick={() => act('enter', 'You are entered!')}>Enter for free</button>
            <button className="btn btn-ghost" onClick={() => act('withdraw', 'Entry withdrawn.')}>Withdraw</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Provable fairness</h2>
        <p className="muted">Seed hash committed at announce:{' '}
          <code>{detail.seedHash ? detail.seedHash.slice(0, 24) + '…' : 'not announced yet'}</code>
        </p>
        {detail.seedRevealed && (
          <p className="muted">Revealed seed:{' '}
            <code>{detail.seedRevealed.slice(0, 24)}…</code>{' '}
            — hash it to verify the draw.
          </p>
        )}
        <p className="muted">Weights come from non-monetary fan scores only; max 5:1 odds advantage.</p>
      </div>

      {results?.winners && (
        <div className="card">
          <h2>Winners</h2>
          <ul className="clean">
            {results.winners.map((w, i) => (
              <li key={i}>#{w.rank ?? i + 1} — {w.displayName}{w.handle ? ` (@${w.handle})` : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {results?.own && (
        <div className="card">
          <h2>Your entry</h2>
          {results.own.isWinner && <p className="success">🎉 You won! Rank #{results.own.rank}.</p>}
          {results.own.isAlternate && !results.own.isWinner && <p className="success">You are an alternate.</p>}
          {!results.own.isWinner && !results.own.isAlternate && <p className="muted">Not selected this time.</p>}
          <p className="muted">
            Your fan-score band: <span className="badge">{results.own.scoreBand ?? 'n/a'}</span>{' '}
            (exact scores are never shown).
          </p>
        </div>
      )}
    </div>
  );
}
