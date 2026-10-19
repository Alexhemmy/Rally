'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';

type Session = {
  id: string;
  favoriteId: string;
  title: string;
  kind: string;
  status: string;
  isPaused: boolean;
  startsAt: string | null;
  viewerCount: number;
};

type CatalogItem = { id: string; name: string; tokenCost: number };
type BoardRow = { name: string; handle: string | null; tokens: number };

export default function LivePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [myFavId, setMyFavId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('audio');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Session | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [giftItemId, setGiftItemId] = useState('');
  const [giftMsg, setGiftMsg] = useState('');
  const authed = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ sessions: Session[] }>('/api/live', { skipAuth: true });
      setSessions(r.sessions || []);
      const c = await api<{ items: CatalogItem[] }>('/api/gifts/catalog', { skipAuth: true });
      setCatalog(c.items || []);
      if (getToken()) {
        const me = await api<{ user: any }>('/api/auth/me');
        setMyFavId(me.user?.favoriteProfile?.id ?? null);
        setIsAdmin((me.user?.roles || []).includes('ADMIN'));
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function schedule() {
    if (!myFavId) { setErr('Only Favorites can schedule sessions'); return; }
    setErr(''); setMsg('');
    try {
      await api('/api/live', { method: 'POST', body: JSON.stringify({ favoriteId: myFavId, title, kind }) });
      setTitle('');
      setMsg('Session scheduled');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function control(id: string, action: string) {
    setErr(''); setMsg('');
    try {
      await api('/api/live/' + id + '/' + action, { method: 'POST' });
      setMsg('Session ' + action + (action === 'end' ? 'ed' : 'd'));
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function openSession(s: Session) {
    setActive(s);
    setBoard([]);
    try {
      if (authed && s.status !== 'ended') {
        await api('/api/live/' + s.id + '/join', { method: 'POST' });
      }
      const r = await api<{ leaderboard: BoardRow[] }>('/api/live/' + s.id + '/leaderboard', { skipAuth: true });
      setBoard(r.leaderboard || []);
    } catch (e: any) { setErr(e.message); }
  }

  async function sendGift() {
    if (!active) return;
    setErr(''); setMsg('');
    try {
      await api('/api/live/' + active.id + '/gift', {
        method: 'POST',
        body: JSON.stringify({ catalogItemId: giftItemId, message: giftMsg || undefined }),
      });
      setGiftMsg('');
      setMsg('Gift sent! It counts on the live leaderboard.');
      const r = await api<{ leaderboard: BoardRow[] }>('/api/live/' + active.id + '/leaderboard', { skipAuth: true });
      setBoard(r.leaderboard || []);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h1>Live sessions</h1>
      <p className="muted">
        Audio/video sessions with real-time Gifts, a live leaderboard, and a host pause switch (GFT-10).
        Gifts earn Gift Points at the usual rate; self-gifting stays blocked (ROL-3).
      </p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {loading && <p className="muted">Loading…</p>}

      {authed && (myFavId || isAdmin) && (
        <div className="card stack">
          <h2>Host controls</h2>
          <input placeholder="Session title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="row">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
            <button className="btn" onClick={schedule} disabled={!title}>Schedule session</button>
          </div>
          <p className="muted">Start, pause, resume and end your sessions below. While paused, gifting is blocked.</p>
        </div>
      )}

      <div className="stack">
        {sessions.map((s) => {
          const mine = myFavId === s.favoriteId;
          return (
            <div className="card" key={s.id}>
              <h2>{s.title}</h2>
              <p>
                <span className="badge">{s.kind}</span>{' '}
                <span className="badge">{s.status}</span>{' '}
                {s.isPaused && <span className="badge">gifting paused</span>}
                <span className="badge">{s.viewerCount} viewers</span>
              </p>
              <div className="row">
                <button className="btn btn-ghost" onClick={() => openSession(s)}>
                  {active?.id === s.id ? 'Refresh' : 'Join & view leaderboard'}
                </button>
                {mine && s.status === 'scheduled' && <button className="btn" onClick={() => control(s.id, 'start')}>Start</button>}
                {mine && s.status === 'live' && <button className="btn" onClick={() => control(s.id, 'pause')}>Pause gifting</button>}
                {mine && s.status === 'paused' && <button className="btn" onClick={() => control(s.id, 'resume')}>Resume</button>}
                {mine && s.status !== 'ended' && <button className="btn btn-ghost" onClick={() => control(s.id, 'end')}>End</button>}
              </div>
              {active?.id === s.id && (
                <div style={{ marginTop: 12 }}>
                  {board.length > 0 && (
                    <>
                      <h3>Live leaderboard</h3>
                      <ol style={{ margin: '8px 0 12px 18px' }}>
                        {board.map((b, i) => (
                          <li key={i}>{b.name} {b.handle ? '(@' + b.handle + ')' : ''} — {b.tokens} tokens</li>
                        ))}
                      </ol>
                    </>
                  )}
                  {authed && s.status === 'live' && !s.isPaused && (
                    <div className="stack">
                      <select onChange={(e) => setGiftItemId(e.target.value)} defaultValue="">
                        <option value="" disabled>Choose a gift</option>
                        {catalog.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} — {c.tokenCost} tokens</option>
                        ))}
                      </select>
                      <input placeholder="Message (optional)" value={giftMsg} onChange={(e) => setGiftMsg(e.target.value)} />
                      <button className="btn" onClick={sendGift} disabled={!giftItemId}>Send live gift</button>
                    </div>
                  )}
                  {!authed && <p className="muted"><a href="/login">Log in</a> to send live gifts.</p>}
                  {s.status !== 'live' && <p className="muted">Gifting is open only while the session is live.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!loading && sessions.length === 0 && (
        <div className="card"><p className="muted">No live or scheduled sessions right now.</p></div>
      )}
    </div>
  );
}
