'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Log in to see notifications. Sessions end after 7 days of inactivity.');
      return;
    }
    api<{ notifications: any[] }>('/api/notifications', { token })
      .then((r) => setItems(r.notifications || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Notifications</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Gifts, verification, payouts, system alerts.</p>
      {error && (
        <div className="card">
          <p className="error">{error}</p>
          <a className="btn" href="/login">Log in</a>
        </div>
      )}
      {!error && items.length === 0 && (
        <div className="card"><p className="muted">No notifications yet.</p></div>
      )}
      {items.map((n) => (
        <div key={n.id} className="card">
          <h2>{n.title}</h2>
          {n.body && <p className="muted">{n.body}</p>}
          <p className="muted" style={{ fontSize: 12 }}>{n.type}</p>
        </div>
      ))}
    </div>
  );
}
