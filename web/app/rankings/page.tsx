'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function RankingsPage() {
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    api<{ rankings: any[] }>('/api/rankings')
      .then((r) => setRankings(r.rankings || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1>Rankings</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Rally Score balances unique supporters, capped gift signal, content, and rising bonus — not pure spend.
      </p>
      <div className="card">
        {rankings.length === 0 && <p className="muted">No published Favorites yet — seed demo @mia.</p>}
        {rankings.map((r, i) => (
          <div key={r.handle} className="list-row">
            <div>
              <strong>#{i + 1} @{r.handle}</strong>
              <p className="muted">{r.cohort} · score {r.score} · {r.supporterCount} supporters</p>
            </div>
            <a href={`/f/${r.handle}`}>Open</a>
          </div>
        ))}
      </div>
    </div>
  );
}
