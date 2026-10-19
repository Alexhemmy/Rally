'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    if (t) setToken(t);
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/auth/password-reset/request', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email }),
      } as any);
      setMsg('If that email exists, reset instructions were sent. The link expires in 30 minutes.');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/auth/password-reset/confirm', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ token, newPassword }),
      } as any);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (token) {
    return (
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Choose a new password</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          Your new password needs at least 8 characters, a lowercase letter, and an uppercase
          letter or digit. All other sessions will be signed out.
        </p>
        {done ? (
          <>
            <p className="success">Password updated. You can now <a href="/login">log in</a>.</p>
            <p className="muted">Rally will never ask for your password in a message.</p>
          </>
        ) : (
          <form onSubmit={confirmReset} className="stack">
            <label>New password</label>
            <input
              className="input"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="error">{error}</p>}
            <button className="btn" type="submit">Set new password</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Forgot password</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        We will send a reset link if the account exists. Links are single-use and expire in
        30 minutes.
      </p>
      <form onSubmit={requestReset} className="stack">
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
