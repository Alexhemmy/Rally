'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type Item = {
  id: string; favoriteId: string; title: string; description: string | null;
  priceCents: number; currency: string; deliveryType: string; deliveryWindowDays: number;
};
type Order = {
  id: string; status: string; amountCents: number; currency: string;
  dueAt: string | null; deliveryProof?: string | null; item: Item | null;
};

export default function StorePage() {
  const [handle, setHandle] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [library, setLibrary] = useState<Order[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ orders: Order[] }>('/api/store/library');
      setLibrary(r.orders || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function findStore() {
    setErr(''); setMsg(''); setItems([]);
    try {
      const u = await api<{ user: any }>(`/api/users/${handle.replace(/^@/, '')}`, { skipAuth: true });
      const favId = u.user?.favoriteProfile?.id || u.user?.favoriteId;
      if (!favId) throw new Error('That user is not a Favorite');
      const r = await api<{ items: Item[] }>(`/api/store/favorite/${favId}`, { skipAuth: true });
      setItems(r.items || []);
    } catch (e: any) {
      setErr(e.message || 'Favorite not found');
    }
  }

  async function order(itemId: string) {
    setErr(''); setMsg('');
    try {
      await api('/api/store/orders', { method: 'POST', body: JSON.stringify({ itemId }) });
      setMsg('Order placed! If it is not delivered by the deadline, you are refunded automatically.');
      load();
    } catch (e: any) {
      setErr(e.message || 'Order failed');
    }
  }

  return (
    <div>
      <h1>Store</h1>
      <p className="muted">
        Real services and products from Favorites, with commissions and delivery guarantees.
        Store items are never exchangeable for Gifts.
      </p>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}

      <div className="card">
        <h2>Browse a Favorite's store</h2>
        <div className="row">
          <input className="input" style={{ flex: 1 }} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@favorite_handle" />
          <button className="btn" onClick={findStore} disabled={!handle}>Browse</button>
        </div>
        {items.map((it) => (
          <div className="list-row" key={it.id}>
            <span>
              <strong>{it.title}</strong> · ${(it.priceCents / 100).toFixed(2)}
              <span className="muted"> · {it.deliveryType} · ships in ≤{it.deliveryWindowDays}d</span>
            </span>
            {authed ? (
              <button className="btn" onClick={() => order(it.id)}>Order</button>
            ) : (
              <a className="btn" href="/login">Log in</a>
            )}
          </div>
        ))}
      </div>

      {authed && (
        <div className="card">
          <h2>Purchase library</h2>
          {library.length === 0 && <p className="muted">No purchases yet.</p>}
          {library.map((o) => (
            <div className="list-row" key={o.id}>
              <span>
                <strong>{o.item?.title ?? 'Item'}</strong> · <span className="badge">{o.status}</span>
                {o.dueAt && <span className="muted"> · due {new Date(o.dueAt).toLocaleDateString()}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
