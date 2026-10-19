'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type City = { city: string; activeFans: number };
type LaneRow = {
  rank: number;
  favoriteId: string;
  name: string;
  handle: string | null;
  cohort: string | null;
  uniqueSupporters: number;
  movement: number | null;
};

export default function CityRankingsPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<string | null>(null);
  const [lane, setLane] = useState<LaneRow[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCities = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ cities: City[] }>('/api/city-rankings/cities', { skipAuth: true });
      setCities(r.cities || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCities(); }, [loadCities]);

  async function openCity(c: string) {
    setCity(c);
    setErr('');
    try {
      const r = await api<{ lane: LaneRow[] }>('/api/city-rankings/' + encodeURIComponent(c), { skipAuth: true });
      setLane(r.lane || []);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h1>City rankings</h1>
      <p className="muted">
        Monthly city lanes of local Favorites — ranked by UNIQUE local supporters, never by spend
        volume. Set your city in Settings to appear in your local lane.
      </p>
      {err && <p className="error">{err}</p>}
      {loading && <p className="muted">Loading…</p>}

      {city && (
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="badge">{city}</span>
          <button className="btn btn-ghost" onClick={() => { setCity(null); setLane([]); }}>← All cities</button>
        </div>
      )}

      {!city && (
        <div className="stack">
          {cities.map((c) => (
            <div className="card" key={c.city}>
              <h2>{c.city}</h2>
              <p className="muted">{c.activeFans} active local fans this month</p>
              <button className="btn" onClick={() => openCity(c.city)}>View {c.city} lane</button>
            </div>
          ))}
          {!loading && cities.length === 0 && (
            <div className="card"><p className="muted">No city lanes yet — fans need to set their city.</p></div>
          )}
        </div>
      )}

      {city && (
        <div className="card">
          <h2>{city} · top Favorites this month</h2>
          {lane.length === 0 && <p className="muted">No ranked Favorites in this lane yet.</p>}
          <ol style={{ margin: '8px 0 0 18px' }}>
            {lane.map((r) => (
              <li key={r.favoriteId} style={{ marginBottom: 6 }}>
                {r.handle ? <a href={'/u/' + r.handle}>{r.name}</a> : r.name}
                {' — '}{r.uniqueSupporters} unique supporters{' '}
                {r.movement !== null && (
                  <span className="badge">{r.movement > 0 ? '▲' + r.movement : r.movement < 0 ? '▼' + Math.abs(r.movement) : '—'}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
