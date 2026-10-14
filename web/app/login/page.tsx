'use client';
import { useState } from 'react';
import { api, setToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ada@rally.demo');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api<{ token: string }>('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      } as any);
      setToken(res.token);
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
      <h1>Log in</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Session stays valid with activity; after <strong>7 days inactive</strong> you must sign in again.
      </p>
      <p className="muted" style={{ marginBottom: 16 }}>Demo: ada@rally.demo / password123</p>
      <form onSubmit={onSubmit} className="stack">
        <div>
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>{loading ? '…' : 'Log in'}</button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        <a href="/forgot-password" style={{ color: 'var(--primary)' }}>Forgot password?</a>
        {' · '}
        <a href="/register" style={{ color: 'var(--primary)' }}>Register</a>
      </p>
    </div>
  );
}
