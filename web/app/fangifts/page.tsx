'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type FanGift = {
  id: string; kind: string; tokens: number | null; catalogItemId: string | null;
  message: string | null; status: string; expiresAt: string | null;
};

export default function FanGiftsPage() {
  const [received, setReceived] = useState<FanGift[]>([]);
  const [sent, setSent] = useState<FanGift[]>([]);
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [handle, setHandle] = useState('');
  const [amount, setAmount] = useState('10');
  const [selectedCosmetic, setSelectedCosmetic] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [r1, r2, r3] = await Promise.all([
        api<{ gifts: FanGift[] }>('/api/fangifts/received'),
        api<{ gifts: FanGift[] }>('/api/fangifts/sent'),
        api<{ items: any[] }>('/api/fangifts/catalog', { skipAuth: true }),
      ]);
      setReceived(r1.gifts || []);
      setSent(r2.gifts || []);
      setCosmetics(r3.items || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load fan gifts');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sendTokens() {
    setErr(''); setMsg('');
    try {
      await api('/api/fangifts/tokens', {
        method: 'POST',
        body: JSON.stringify({ recipientHandle: handle, amount: parseInt(amount, 10) }),
      });
      setMsg('Tokens sent! Recipient has 72 hours to accept.');
      load();
    } catch (e: any) {
      setErr(e.message || 'Send failed');
    }
  }

  async function sendCosmetic() {
    setErr(''); setMsg('');
    try {
      await api('/api/fangifts/cosmetic', {
        method: 'POST',
        body: JSON.stringify({ recipientHandle: handle, catalogItemId: selectedCosmetic }),
      });
      setMsg('Cosmetic gift sent!');
      load();
    } catch (e: any) {
      setErr(e.message || 'Send failed');
    }
  }

  async function act(id: string, action: 'accept' | 'decline' | 'recover') {
    setErr('');
    try {
      await api(`/api/fangifts/${id}/${action}`, { method: 'POST' });
      load();
    } catch (e: any) {
      setErr(e.message || 'Action failed');
    }
  }

  if (!authed) {
    return (
      <div>
        <h1>Fan Gifts</h1>
        <p className="muted">Send Tokens and cosmetic gifts to fellow fans. Received Tokens can only be spent on Gifts inside Rally — never cashed out.</p>
        <a className="btn" href="/login">Log in to start</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Fan Gifts</h1>
      <p className="muted">Fan-to-fan gifting: cosmetic gifts and escrowed Token transfers (72h accept window). Minors are excluded.</p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      <div className="card">
        <h2>Send a gift</h2>
        <label htmlFor="handle">Recipient handle</label>
        <input id="handle" className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@fan_handle" />
        <label htmlFor="amount">Token amount (1–1000, daily limit 200)</label>
        <input id="amount" className="input" type="number" min={1} max={1000} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button className="btn" onClick={sendTokens} disabled={!handle}>Send Tokens</button>
        {cosmetics.length > 0 && (
          <>
            <label style={{ marginTop: '0.75rem' }}>…or send a cosmetic</label>
            <div className="gift-grid">
              {cosmetics.map((c) => (
                <div
                  key={c.id}
                  className={'gift-item' + (selectedCosmetic === c.id ? ' selected' : '')}
                  onClick={() => setSelectedCosmetic(c.id)}
                >
                  <div style={{ fontSize: '1.4rem' }}>{c.emoji || '🎁'}</div>
                  <div className="muted">{c.name}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={sendCosmetic} disabled={!handle || !selectedCosmetic}>
              Send cosmetic
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h2>Received</h2>
        {received.length === 0 && <p className="muted">Nothing yet.</p>}
        {received.map((g) => (
          <div className="list-row" key={g.id}>
            <span>
              {g.kind === 'tokens' ? `${g.tokens} Tokens` : 'Cosmetic gift'} · <span className="badge">{g.status}</span>
            </span>
            {g.status === 'pending' && g.kind === 'tokens' && (
              <span className="row">
                <button className="btn" onClick={() => act(g.id, 'accept')}>Accept</button>
                <button className="btn btn-ghost" onClick={() => act(g.id, 'decline')}>Decline</button>
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Sent</h2>
        {sent.length === 0 && <p className="muted">Nothing yet.</p>}
        {sent.map((g) => (
          <div className="list-row" key={g.id}>
            <span>
              {g.kind === 'tokens' ? `${g.tokens} Tokens` : 'Cosmetic gift'} · <span className="badge">{g.status}</span>
            </span>
            {g.status === 'pending' && g.expiresAt && new Date(g.expiresAt) < new Date() && (
              <button className="btn btn-ghost" onClick={() => act(g.id, 'recover')}>Recover</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
