'use client';
import { useState } from 'react';
import { api, setToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', handle: '', displayName: '', role: 'FAN' as 'FAN' | 'FAVORITE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api<{ token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setToken(res.token);
      router.push(form.role === 'FAVORITE' ? '/dashboard' : '/explore');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit} className="stack" style={{ marginTop: 12 }}>
        <div>
          <label>Display name</label>
          <input className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
        </div>
        <div>
          <label>Handle</label>
          <input className="input" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} required pattern="[a-zA-Z0-9_]+" />
        </div>
        <div>
          <label>Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label>Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </div>
        <div>
          <label>I am a</label>
          <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
            <option value="FAN">Fan</option>
            <option value="FAVORITE">Favorite (creator / public figure)</option>
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>{loading ? '…' : 'Register'}</button>
      </form>
    </div>
  );
}
