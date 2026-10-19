'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

type Application = {
  id: string;
  status: string;
  guardianName: string;
  consentAt: string | null;
  note: string | null;
};

const STATUS_TEXT: Record<string, string> = {
  pending: 'Waiting for guardian consent — share the 6-digit code with your guardian.',
  consented: 'Guardian consent verified. An admin will review your application.',
  approved: 'You are a Junior Favorite! 🎉 No payouts, no giveaways, no cash prizes.',
  rejected: 'Application not approved.',
  revoked: 'Your Junior Favorite status was revoked.',
};

export default function JuniorPage() {
  const [app, setApp] = useState<Application | null>(null);
  const [form, setForm] = useState({ guardianName: '', guardianPhone: '', guardianEmail: '' });
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ application: Application | null }>('/api/junior/me');
      setApp(r.application || null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function apply() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ application: { id: string; status: string }; devConsentCode?: string }>('/api/junior/apply', {
        method: 'POST',
        body: JSON.stringify({
          guardianName: form.guardianName,
          guardianPhone: form.guardianPhone,
          ...(form.guardianEmail ? { guardianEmail: form.guardianEmail } : {}),
        }),
      });
      setDevCode(r.devConsentCode || '');
      setMsg('Application submitted. Guardian consent is next.');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function verify() {
    if (!app) return;
    setErr(''); setMsg('');
    try {
      await api('/api/junior/' + app.id + '/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setCode('');
      setMsg('Guardian consent verified!');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h1>Junior Favorite program</h1>
      <p className="muted">
        16–17 year-olds can become Junior Favorites with guardian consent (UPG-7).
        Junior Favorites get a page and community tools but NO payouts, NO giveaways,
        and NO cash-prize eligibility. Guardian identity is verified before approval.
      </p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      {!authed && (
        <div className="card">
          <p className="muted"><a href="/login">Log in</a> with the 16–17 year-old account to apply.</p>
        </div>
      )}

      {authed && !app && (
        <div className="card stack">
          <h2>Apply</h2>
          <input placeholder="Guardian full name" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
          <input placeholder="Guardian phone" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          <input placeholder="Guardian email (optional)" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} />
          <button className="btn" onClick={apply} disabled={!form.guardianName || form.guardianPhone.length < 7}>Submit application</button>
        </div>
      )}

      {app && (
        <div className="card stack">
          <p><span className="badge">{app.status}</span>{' '}
             <span className="badge">guardian: {app.guardianName}</span></p>
          <p className="muted">{STATUS_TEXT[app.status] || app.status}</p>
          {app.note && <p className="muted">Reviewer note: {app.note}</p>}
          {app.status === 'pending' && (
            <div className="stack">
              <input placeholder="6-digit consent code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
              <button className="btn" onClick={verify} disabled={code.length !== 6}>Verify guardian consent</button>
            </div>
          )}
          {devCode && <p className="muted">Dev mode: consent code is <strong>{devCode}</strong> (production sends it to the guardian via SMS).</p>}
        </div>
      )}
    </div>
  );
}
