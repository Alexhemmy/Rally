'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function MomentPage({ params }: { params: { id: string } }) {
  const [moment, setMoment] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ moment: any }>(`/api/moments/${params.id}`)
      .then((r) => setMoment(r.moment))
      .catch((e) => setError(e.message));
  }, [params.id]);

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {!moment && !error && <p className="muted">Loading…</p>}
      {moment && (
        <>
          <span className="badge">{moment.type}</span>
          <h1 style={{ marginTop: 8 }}>{moment.title}</h1>
          <p className="muted">{moment.description}</p>
          <div className="card">
            <p>{moment.supportCount} supports · {moment.reactionCount} reactions</p>
            <a className="btn" href={`/f/${moment.favorite?.user?.handle || 'mia'}`}>Support this Moment</a>
          </div>
        </>
      )}
    </div>
  );
}
