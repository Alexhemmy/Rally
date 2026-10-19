'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

type Item = {
  id: string;
  favoriteId: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  deliveryWindowDays: number;
};
type Order = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  dueAt: string | null;
  trackingCode: string | null;
  item: { title: string } | null;
};

export default function MerchPage() {
  const [handle, setHandle] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [library, setLibrary] = useState<Order[]>([]);
  const [favOrders, setFavOrders] = useState<Order[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [shipping, setShipping] = useState({ name: '', line1: '', city: '', country: '', phone: '' });
  const [orderItem, setOrderItem] = useState<string>('');
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const authed = typeof window !== 'undefined' && !!getToken();

  const loadLibrary = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ orders: Order[] }>('/api/merch/library');
      setLibrary(r.orders || []);
      const me = await api<{ user: any }>('/api/auth/me');
      if (me.user?.favoriteProfile) {
        setIsFav(true);
        const fo = await api<{ orders: Order[] }>('/api/merch/orders');
        setFavOrders(fo.orders || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  async function browse() {
    setErr(''); setMsg('');
    try {
      const u = await api<{ user: any }>('/api/users/' + handle.trim().replace(/^@/, ''), { skipAuth: true });
      const favId = u.user?.favoriteProfile?.id;
      if (!favId) { setErr('That user is not a published Favorite'); return; }
      const r = await api<{ items: Item[] }>('/api/merch/items/' + favId, { skipAuth: true });
      setItems(r.items || []);
      if (!(r.items || []).length) setMsg('This Favorite has no merch yet.');
    } catch (e: any) { setErr(e.message); }
  }

  async function order(itemId: string) {
    setErr(''); setMsg('');
    try {
      await api('/api/merch/orders', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          shippingAddress: {
            name: shipping.name,
            line1: shipping.line1,
            city: shipping.city,
            country: shipping.country.toUpperCase(),
            ...(shipping.phone ? { phone: shipping.phone } : {}),
          },
        }),
      });
      setOrderItem('');
      setMsg('Order placed! It auto-refunds if delivery misses the window.');
      loadLibrary();
    } catch (e: any) { setErr(e.message); }
  }

  async function orderAction(id: string, action: string) {
    setErr(''); setMsg('');
    try {
      if (action === 'fulfill') {
        await api('/api/merch/orders/' + id + '/fulfill', {
          method: 'POST',
          body: JSON.stringify({ trackingCode: tracking[id] || '' }),
        });
      } else {
        await api('/api/merch/orders/' + id + '/' + action, { method: 'POST' });
      }
      setMsg('Order ' + action + 'ed');
      loadLibrary();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h1>Merch</h1>
      <p className="muted">
        Physical merch fulfilled via partners: delivery window, tracking, and an automatic refund
        if delivery misses the deadline. Merch is never exchangeable for Gifts (SUB-5).
      </p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      <div className="card stack">
        <h2>Browse a Favorite&apos;s merch</h2>
        <div className="row">
          <input placeholder="Favorite handle (e.g. mia)" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <button className="btn" onClick={browse}>Browse</button>
        </div>
        {items.map((i) => (
          <div className="card" key={i.id}>
            <h3>{i.title}</h3>
            <p><span className="badge">{(i.priceCents / 100).toFixed(2)} {i.currency}</span>{' '}
               <span className="badge">ships in {i.deliveryWindowDays} days</span></p>
            {i.description && <p className="muted">{i.description}</p>}
            {authed ? (
              orderItem === i.id ? (
                <div className="stack">
                  <input placeholder="Full name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
                  <input placeholder="Address line" value={shipping.line1} onChange={(e) => setShipping({ ...shipping, line1: e.target.value })} />
                  <input placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                  <input placeholder="Country code (e.g. NG)" maxLength={2} value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
                  <input placeholder="Phone (optional)" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                  <div className="row">
                    <button className="btn" onClick={() => order(i.id)} disabled={!shipping.name || !shipping.line1 || !shipping.city || shipping.country.length !== 2}>Confirm order</button>
                    <button className="btn btn-ghost" onClick={() => setOrderItem('')}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn" onClick={() => setOrderItem(i.id)}>Order</button>
              )
            ) : (
              <a className="btn btn-ghost" href="/login">Log in to order</a>
            )}
          </div>
        ))}
      </div>

      {authed && (
        <div className="card stack">
          <h2>Your orders</h2>
          {library.length === 0 && <p className="muted">No merch orders yet.</p>}
          {library.map((o) => (
            <div key={o.id}>
              <p><span className="badge">{o.item?.title ?? 'Item'}</span>{' '}
                 <span className="badge">{o.status}</span>{' '}
                 <span className="badge">{(o.amountCents / 100).toFixed(2)} {o.currency}</span></p>
              {o.dueAt && <p className="muted">Due {new Date(o.dueAt).toLocaleDateString()}</p>}
              {o.trackingCode && <p className="muted">Tracking: {o.trackingCode}</p>}
              <div className="row">
                {o.status === 'shipped' && <button className="btn" onClick={() => orderAction(o.id, 'deliver')}>Confirm delivery</button>}
                {['paid', 'shipped'].includes(o.status) && new Date(o.dueAt || 0) < new Date() && (
                  <button className="btn btn-ghost" onClick={() => orderAction(o.id, 'refund')}>Request refund</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {authed && isFav && (
        <div className="card stack">
          <h2>Fulfillment queue</h2>
          {favOrders.length === 0 && <p className="muted">No incoming orders.</p>}
          {favOrders.filter((o) => o.status === 'paid').map((o) => (
            <div key={o.id}>
              <p><span className="badge">order</span> {o.id.slice(0, 8)} · {(o.amountCents / 100).toFixed(2)} {o.currency} · due {o.dueAt ? new Date(o.dueAt).toLocaleDateString() : '—'}</p>
              <div className="row">
                <input placeholder="Tracking code" value={tracking[o.id] || ''} onChange={(e) => setTracking({ ...tracking, [o.id]: e.target.value })} />
                <button className="btn" onClick={() => orderAction(o.id, 'fulfill')} disabled={!tracking[o.id]}>Mark shipped</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
