'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type Progress = {
  signals: {
    accountAge30Days: boolean;
    verifiedAdult: boolean;
    tenPublished: boolean;
    hundredFollowers: boolean;
    fiftyEngagers: boolean;
    noStrikes: boolean;
  };
  passed: number;
  total: number;
  eligible: boolean;
};

type Request = { id: string; status: string; createdAt: string; reviewerNote?: string | null; rejectionReasons?: string[] };

const LABELS: Record<string, string> = {
  accountAge30Days: 'Account at least 30 days old',
  verifiedAdult: 'Verified phone or social login, and 18+',
  tenPublished: '10+ published posts or Moments',
  hundredFollowers: '100+ followers',
  fiftyEngagers: '50+ distinct fans engaged in the last 60 days',
  noStrikes: 'No moderation strikes',
};

export default function UpgradePage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [pitch, setPitch] = useState('');
  const [samples, setSamples] = useState('');
  const [declaredLinks, setDeclaredLinks] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [p, m] = await Promise.all([
        api<Progress>('/api/upgrades/progress'),
        api<{ requests: Request[] }>('/api/upgrades/me'),
      ]);
      setProgress(p);
      setRequests(m.requests || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function apply() {
    setErr(''); setMsg('');
    try {
      await api('/api/upgrades/request', {
        method: 'POST',
        body: JSON.stringify({
          pitch,
          samples: samples.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
          declaredLinks: declaredLinks || undefined,
        }),
      });
      setMsg('Application submitted! Rally reviews applications with human oversight.');
      setPitch(''); setSamples('');
      load();
    } catch (e: any) {
      setErr(e.message || 'Submit failed');
    }
  }

  if (!authed) {
    return (
      <div>
        <h1>Become a Favorite</h1>
        <p className="muted">Earn your way from fan to Favorite through community signals — never by paying.</p>
        <a className="btn" href="/login">Log in to check your progress</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Become a Favorite</h1>
      <p className="muted">Upgrade by community standing: activeness, quality and audience — money never counts (PRD §18).</p>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}

      {progress && (
        <div className="card">
          <h2>Progress · {progress.passed}/{progress.total}</h2>
          <ul className="clean">
            {Object.entries(progress.signals).map(([k, ok]) => (
              <li key={k}>{ok ? '✅' : '⬜'} {LABELS[k] ?? k}</li>
            ))}
          </ul>
        </div>
      )}

      {progress?.eligible ? (
        <div className="card">
          <h2>Apply</h2>
          <label htmlFor="pitch">Pitch (50–2000 chars)</label>
          <textarea id="pitch" rows={5} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Who are you, and why should fans support you?" />
          <label htmlFor="samples">Work samples (one URL per line)</label>
          <textarea id="samples" rows={3} value={samples} onChange={(e) => setSamples(e.target.value)} placeholder="https://…" />
          <label htmlFor="links">Declared relationships with other Favorites (optional)</label>
          <input id="links" className="input" value={declaredLinks} onChange={(e) => setDeclaredLinks(e.target.value)} />
          <button className="btn" onClick={apply} disabled={pitch.length < 50}>Submit application</button>
        </div>
      ) : (
        <div className="card">
          <p className="muted">Complete all signals above to unlock the application form.</p>
        </div>
      )}

      {requests.length > 0 && (
        <div className="card">
          <h2>My applications</h2>
          {requests.map((r) => (
            <div className="list-row" key={r.id}>
              <span><span className="badge">{r.status}</span> · {new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {requests.some((r) => r.status === 'rejected') && (
            <p className="muted">Rejected applications show the reasons so you can improve and reapply.</p>
          )}
        </div>
      )}
    </div>
  );
}
