'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/auth/password-reset/request', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email }),
      } as any);
      setMsg('If that email exists, reset instructions were sent.');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Forgot password</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        We will email a reset link if the account exists. Sessions last until 7 days of inactivity.
      </p>
      <form onSubmit={submit} className="stack">
        <label>Email</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {msg && <p className="success">{msg}</p>}
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">Send reset link</button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        <a href="/login" style={{ color: 'var(--primary)' }}>Back to log in</a>
      </p>
    </div>
  );
}
