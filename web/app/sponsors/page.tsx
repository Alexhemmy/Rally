'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

type Sponsor = { id: string; name: string; countryCode: string };

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ name: '', contactEmail: '', countryCode: 'NG' });
  const [adminId, setAdminId] = useState('');
  const [giveawayId, setGiveawayId] = useState('');
  const [tokens, setTokens] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    try {
      const r = await api<{ sponsors: Sponsor[] }>('/api/sponsors', { skipAuth: true });
      setSponsors(r.sponsors || []);
      if (getToken()) {
        const me = await api<{ user: any }>('/api/auth/me');
        setIsAdmin((me.user?.roles || []).includes('ADMIN'));
      }
    } catch (e: any) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    setErr(''); setMsg('');
    try {
      await api('/api/sponsors', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(form),
      });
      setMsg('Application received — KYB review is next.');
      setForm({ name: '', contactEmail: '', countryCode: 'NG' });
    } catch (e: any) { setErr(e.message); }
  }

  async function adminAction(path: string, body?: any) {
    setErr(''); setMsg('');
    try {
      await api('/api/sponsors' + path, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) });
      setMsg('Done');
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h1>Brand partnerships</h1>
      <p className="muted">
        Brands pass KYB, fund prize pools up front in escrow, and are clearly labeled on every
        sponsored giveaway. Token prizes go to winners&apos; gifted balance only — spendable on Gifts,
        never withdrawable, which blocks gift-back loops (GVW-2 / Q33).
      </p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      <div className="card stack">
        <h2>Approved sponsors</h2>
        {sponsors.map((s) => (
          <p key={s.id}><span className="badge">{s.name}</span> <span className="muted">{s.countryCode}</span></p>
        ))}
        {sponsors.length === 0 && <p className="muted">No approved sponsors yet.</p>}
      </div>

      <div className="card stack">
        <h2>Apply for brand partnership (KYB)</h2>
        <input placeholder="Brand name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <input placeholder="Country code (e.g. NG)" maxLength={2} value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} />
        <button className="btn" onClick={submit} disabled={!form.name || !form.contactEmail}>Submit KYB application</button>
      </div>

      {authed && isAdmin && (
        <div className="card stack">
          <h2>Admin tools</h2>
          <div className="row">
            <input placeholder="Sponsor id" value={adminId} onChange={(e) => setAdminId(e.target.value)} />
            <button className="btn" onClick={() => adminAction('/' + adminId + '/review', { decision: 'approved' })} disabled={!adminId}>Approve KYB</button>
            <button className="btn btn-ghost" onClick={() => adminAction('/' + adminId + '/review', { decision: 'rejected' })} disabled={!adminId}>Reject</button>
          </div>
          <div className="row">
            <input placeholder="Tokens" value={tokens} onChange={(e) => setTokens(e.target.value)} />
            <button className="btn" onClick={() => adminAction('/' + adminId + '/escrow', { tokens: Number(tokens) })} disabled={!adminId || !tokens}>Add token escrow</button>
          </div>
          <div className="row">
            <input placeholder="Sponsored giveaway id" value={giveawayId} onChange={(e) => setGiveawayId(e.target.value)} />
            <button className="btn" onClick={() => adminAction('/giveaways/' + giveawayId + '/fund')} disabled={!giveawayId}>Fund from escrow</button>
            <button className="btn btn-ghost" onClick={() => adminAction('/giveaways/' + giveawayId + '/settle-tokens')} disabled={!giveawayId}>Settle token prizes</button>
          </div>
          <p className="muted">Create sponsored giveaways and draw them from the Giveaways admin flow.</p>
        </div>
      )}
    </div>
  );
}
