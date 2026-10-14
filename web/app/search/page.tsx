'use client';
import { useState } from 'react';

export default function SearchPage() {
  const [q, setQ] = useState('');
  return (
    <div>
      <h1>Search</h1>
      <p className="muted" style={{ marginBottom: 12 }}>Name, handle, category, location · cross-script matching (PRD FR-51).</p>
      <input className="input" placeholder="Search Favorites…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card">
        <p className="muted">Results appear here. Try demo:</p>
        <a href="/f/mia">@mia</a>
      </div>
    </div>
  );
}
