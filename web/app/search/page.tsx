'use client';
import { useState } from 'react';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const suggestions = [
    { handle: 'mia', label: 'Mia · Afrobeats' },
  ].filter((s) => !q || s.handle.includes(q.toLowerCase()) || s.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h1>Search</h1>
      <p className="muted" style={{ marginBottom: 12 }}>Name, handle, category · cross-script ready (PRD).</p>
      <input
        className="input"
        placeholder="Search Favorites…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="card">
        <h2>Results</h2>
        {suggestions.map((s) => (
          <div key={s.handle} className="list-row">
            <span>{s.label}</span>
            <a className="btn" href={`/f/${s.handle}`}>Open</a>
          </div>
        ))}
        {suggestions.length === 0 && <p className="muted">No matches. Try @mia</p>}
      </div>
      <div className="row">
        <a className="btn btn-ghost" href="/explore">Explore categories</a>
        <a className="btn btn-ghost" href="/rankings">Rankings</a>
      </div>
    </div>
  );
}
