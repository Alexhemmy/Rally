'use client';
import { useState } from 'react';
import { api, getToken } from '@/lib/api';

const STEPS = [
  'Photo & display name',
  'Bio & category',
  'Verify identity (KYC)',
  'Connect payout method',
  'Publish first Moment',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState('');

  async function startKyc() {
    const token = getToken();
    if (!token) { setMsg('Log in first'); return; }
    try {
      const r = await api<{ session: any }>('/api/providers/kyc/start', { method: 'POST', token });
      setMsg(`KYC session: ${r.session.sessionId} (${r.session.provider})`);
      setStep(3);
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div>
      <h1>Favorite onboarding</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Checklist to go live (PRD).</p>
      {STEPS.map((s, i) => (
        <div key={s} className="card" style={{ opacity: i === step ? 1 : 0.7 }}>
          <span className="badge">{i <= step ? 'current' : 'todo'}</span>
          <h2 style={{ marginTop: 8 }}>{s}</h2>
          {i === 2 && i === step && (
            <button className="btn" type="button" onClick={startKyc}>Start KYC</button>
          )}
          {i === step && i !== 2 && (
            <button className="btn" type="button" onClick={() => setStep(Math.min(step + 1, STEPS.length - 1))}>
              Mark done
            </button>
          )}
        </div>
      ))}
      {msg && <p className="success">{msg}</p>}
      <a className="btn btn-ghost" href="/dashboard">Dashboard</a>
    </div>
  );
}
