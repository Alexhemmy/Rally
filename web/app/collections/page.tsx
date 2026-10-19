'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/session';

type Collection = {
  id: string; title: string; isPublic: boolean; momentIds: string[];
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ collections: Collection[] }>('/api/collections/me');
      setCollections(r.collections || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    setErr(''); setMsg('');
    try {
      await api('/api/collections', { method: 'POST', body: JSON.stringify({ title, isPublic: false }) });
      setTitle('');
      load();
    } catch (e: any) {
      setErr(e.message || 'Create failed');
    }
  }

  async function togglePublic(c: Collection) {
    try {
      await api(`/api/collections/${c.id}`, { method: 'PATCH', body: JSON.stringify({ isPublic: !c.isPublic }) });
      load();
    } catch (e: any) {
      setErr(e.message || 'Update failed');
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/collections/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      setErr(e.message || 'Delete failed');
    }
  }

  if (!authed) {
    return (
      <div>
        <h1>Collections</h1>
        <p className="muted">Organize the Moments you love into shareable collections.</p>
        <a className="btn" href="/login">Log in</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Collections</h1>
      <p className="muted">Save Moments into curated sets — keep them private or share a public link.</p>
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}
      <div className="card">
        <h2>New collection</h2>
        <div className="row">
          <input className="input" style={{ flex: 1 }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best studio sessions" />
          <button className="btn" onClick={create} disabled={title.length < 1}>Create</button>
        </div>
      </div>
      {collections.map((c) => (
        <div className="card" key={c.id}>
          <div className="list-row">
            <span><strong>{c.title}</strong> · <span className="badge">{c.momentIds?.length ?? 0} moments</span>{' '}
              <span className="badge">{c.isPublic ? 'public' : 'private'}</span></span>
            <span className="row">
              <button className="btn btn-ghost" onClick={() => togglePublic(c)}>{c.isPublic ? 'Make private' : 'Share'}</button>
              <button className="btn btn-danger" onClick={() => remove(c.id)}>Delete</button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
