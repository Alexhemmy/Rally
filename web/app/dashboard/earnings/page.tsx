'use client';
import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function EarningsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { setError('Auth required'); return; }
    api('/api/favorites/me/earnings', { token })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Earnings</h1>
      <p className="muted">Gift Points convert to cash at published rate. Weekly payouts; on-demand fee (PRD FR-33–36).</p>
      {error && <p className="error">{error}</p>}
      {data && (
        <div className="card">
          <p>Available: <strong>{String(data.balance?.available)}</strong></p>
          <p className="muted">Pending: {String(data.balance?.pending)}</p>
          <button className="btn" type="button" style={{ marginTop: 12 }}>Request payout</button>
        </div>
      )}
    </div>
  );
}
