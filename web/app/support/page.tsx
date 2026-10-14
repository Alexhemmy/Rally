'use client';
import { useState } from 'react';
import { api, getToken } from '@/lib/api';

export default function SupportPage() {
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState('other');
  const [details, setDetails] = useState('');
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState('');

  async function send() {
    const token = getToken();
    if (!token) {
      setSent(true);
      return;
    }
    try {
      await api('/api/moderation/report', {
        method: 'POST',
        token,
        body: JSON.stringify({
          targetType: 'user',
          targetId: targetId || 'unknown',
          reason,
          details,
        }),
      });
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1>Support</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Report issues and safety concerns.</p>
      <div className="card stack">
        <label>Topic / reason</label>
        <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="harassment">Harassment</option>
          <option value="hate">Hate</option>
          <option value="spam">Spam</option>
          <option value="scam">Scam</option>
          <option value="other">Other</option>
        </select>
        <label>Target handle or id</label>
        <input className="input" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        <label>Message</label>
        <textarea className="input" rows={5} value={details} onChange={(e) => setDetails(e.target.value)} />
        <button className="btn" type="button" onClick={send}>Send report</button>
        {sent && <p className="success">Report submitted.</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
