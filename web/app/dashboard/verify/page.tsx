'use client';
import { useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function VerifyPage() {
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState('');

  async function start() {
    const token = getToken();
    if (!token) { setError('Auth required'); return; }
    try {
      const r = await api<{ session: any }>('/api/providers/kyc/start', { method: 'POST', token });
      setSession(r.session);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1>Verification (KYC)</h1>
      <p className="muted">Smile Identity / Sumsub via provider layer. Required before payouts.</p>
      <div className="card stack">
        <button className="btn" type="button" onClick={start}>Start verification</button>
        {session && (
          <>
            <p><span className="badge">{session.provider}</span> {session.status}</p>
            <p className="muted">Session {session.sessionId}</p>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
