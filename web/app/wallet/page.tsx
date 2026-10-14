'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    const token = getToken();
    api<{ packs: any[] }>('/api/tokens/packs').then((r) => setPacks(r.packs || [])).catch(() => {});
    if (!token) return;
    api<{ wallet: any }>('/api/tokens/wallet', { token })
      .then((r) => setWallet(r.wallet))
      .catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function buy(packId: string) {
    const token = getToken();
    if (!token) { setError('Log in first'); return; }
    try {
      await api('/api/tokens/purchase', {
        method: 'POST',
        token,
        body: JSON.stringify({ packId, paymentMethod: 'card', currency: 'USD' }),
      });
      setMsg('Tokens added (mock payment)');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1>Token wallet</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Closed-loop currency. Buy packs, spend on Gifts. Cannot withdraw or transfer Tokens.</p>
      <div className="card">
        <h2>Balance</h2>
        {!getToken() && <p className="error">Log in to see wallet</p>}
        {wallet && (
          <p><strong>{wallet.balance ?? 0}</strong> tokens · gifted balance {wallet.giftedBalance ?? 0}</p>
        )}
      </div>
      <div className="card">
        <h2>Packs</h2>
        {packs.map((p) => (
          <div key={p.id} className="list-row">
            <div>
              <strong>{p.name}</strong>
              <p className="muted">{p.tokens}+{p.bonusTokens} bonus · ${(p.priceCents / 100).toFixed(2)}</p>
            </div>
            <button className="btn" type="button" onClick={() => buy(p.id)}>Buy</button>
          </div>
        ))}
        {packs.length === 0 && <p className="muted">Start API + seed to load packs</p>}
      </div>
      {msg && <p className="success">{msg}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
