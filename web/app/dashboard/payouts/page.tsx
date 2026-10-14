'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function PayoutsPage() {
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState('10');
  const [destination, setDestination] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    const token = getToken();
    if (!token) return;
    api('/api/payouts/me', { token }).then(setData).catch((e) => setError(e.message));
  }
  useEffect(() => { load(); }, []);

  async function request() {
    const token = getToken();
    if (!token) return;
    try {
      await api('/api/payouts/request', {
        method: 'POST',
        token,
        body: JSON.stringify({
          amount: Number(amount),
          method: 'bank',
          destination,
          onDemand: false,
        }),
      });
      setMsg('Payout requested');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1>Payouts</h1>
      <div className="card">
        <p>Available GP: <strong>{data ? String(data.balance?.available) : '—'}</strong></p>
      </div>
      <div className="card stack">
        <label>Amount (Gift Points)</label>
        <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label>Bank / mobile money destination</label>
        <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <button className="btn" type="button" onClick={request}>Request payout</button>
        {msg && <p className="success">{msg}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="card">
        <h2>History</h2>
        {(data?.payouts || []).map((p: any) => (
          <div key={p.id} className="list-row">
            <span>{String(p.amount)} {p.currency}</span>
            <span className="badge">{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
