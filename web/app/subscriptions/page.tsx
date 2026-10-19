'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type Tier = {
  id: string; favoriteId: string; name: string; description: string | null;
  priceCents: number; currency: string; perks: string[];
};
type Sub = {
  id: string; status: string; autoRenew: boolean; currentPeriodEnd: string;
  tier: Tier | null;
};

export default function SubscriptionsPage() {
  const [handle, setHandle] = useState('');
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ subscriptions: Sub[] }>('/api/subscriptions/me');
      setSubs(r.subscriptions || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function findTiers() {
    setErr(''); setMsg(''); setTiers([]);
    try {
      // Look up the Favorite by handle, then fetch their tiers
      const u = await api<{ user: any }>(`/api/users/${handle.replace(/^@/, '')}`, { skipAuth: true });
      const favId = u.user?.favoriteProfile?.id || u.user?.favoriteId;
      if (!favId) throw new Error('That user is not a Favorite');
      const r = await api<{ tiers: Tier[] }>(`/api/subscriptions/favorite/${favId}`, { skipAuth: true });
      setTiers(r.tiers || []);
    } catch (e: any) {
      setErr(e.message || 'Favorite not found');
    }
  }

  async function subscribe(tierId: string) {
    setErr(''); setMsg('');
    try {
      await api('/api/subscriptions/subscribe', { method: 'POST', body: JSON.stringify({ tierId }) });
      setMsg('Subscribed! Manage or cancel anytime below.');
      load();
    } catch (e: any) {
      setErr(e.message || 'Subscribe failed');
    }
  }

  async function act(id: string, action: 'cancel' | 'pause') {
    try {
      await api(`/api/subscriptions/${id}/${action}`, { method: 'POST' });
      load();
    } catch (e: any) {
      setErr(e.message || 'Action failed');
    }
  }

  return (
    <div>
      <h1>Fan Clubs</h1>
      <p className="muted">Join a Favorite's fan club for monthly perks. Cancel anytime — no dark patterns (PRD §14).</p>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}

      <div className="card">
        <h2>Find a fan club</h2>
        <label htmlFor="handle">Favorite handle</label>
        <div className="row">
          <input id="handle" className="input" style={{ flex: 1 }} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@favorite_handle" />
          <button className="btn" onClick={findTiers} disabled={!handle}>Find tiers</button>
        </div>
        {tiers.map((t) => (
          <div className="list-row" key={t.id}>
            <span>
              <strong>{t.name}</strong> · ${(t.priceCents / 100).toFixed(2)}/mo
              {t.perks?.length ? <span className="muted"> · {t.perks.join(', ')}</span> : null}
            </span>
            {authed ? (
              <button className="btn" onClick={() => subscribe(t.id)}>Join</button>
            ) : (
              <a className="btn" href="/login">Log in</a>
            )}
          </div>
        ))}
      </div>

      {authed && (
        <div className="card">
          <h2>My subscriptions</h2>
          {subs.length === 0 && <p className="muted">No fan club memberships yet.</p>}
          {subs.map((s) => (
            <div className="list-row" key={s.id}>
              <span>
                <strong>{s.tier?.name ?? 'Tier'}</strong> · <span className="badge">{s.status}</span>
                {s.status === 'active' && <span className="muted"> · renews {new Date(s.currentPeriodEnd).toLocaleDateString()}</span>}
              </span>
              <span className="row">
                <button className="btn btn-ghost" onClick={() => act(s.id, 'pause')}>{s.status === 'paused' ? 'Resume' : 'Pause'}</button>
                <button className="btn btn-danger" onClick={() => act(s.id, 'cancel')}>Cancel</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
