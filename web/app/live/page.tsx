'use client';
import { useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function LivePage() {
  const [room, setRoom] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function startRoom() {
    const token = getToken();
    if (!token) { setError('Log in as a Favorite to host'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api<{ room: any }>('/api/providers/live/rooms', { method: 'POST', token });
      setRoom(res.room);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Live sessions</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Audio/video Q&amp;A with live gifting. Provider: LiveKit (recommended) or Agora — set keys in env.
      </p>
      <div className="card stack">
        <h2>Host a room</h2>
        <button className="btn" type="button" disabled={loading} onClick={startRoom}>
          {loading ? 'Creating…' : 'Create live room'}
        </button>
        {error && <p className="error">{error}</p>}
        {room && (
          <div>
            <p><span className="badge">{room.provider}</span></p>
            <p className="muted">Room: {room.roomName}</p>
            <p className="muted">Expires: {room.expiresAt}</p>
            <p className="muted" style={{ wordBreak: 'break-all' }}>Token issued for client SDK join</p>
          </div>
        )}
      </div>
      <div className="card">
        <h2>Fans</h2>
        <p className="muted">Join from Favorite page when a session is live. Gifts animate in real time (PRD FR-113).</p>
      </div>
    </div>
  );
}
