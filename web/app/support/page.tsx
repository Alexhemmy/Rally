'use client';
import { useState } from 'react';

export default function SupportPage() {
  const [sent, setSent] = useState(false);
  return (
    <div>
      <h1>Support</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Report issues, safety concerns, or payment problems.</p>
      <div className="card stack">
        <label>Topic</label>
        <select className="select">
          <option>Account / login</option>
          <option>Payments & Tokens</option>
          <option>Safety / harassment</option>
          <option>Verification</option>
          <option>Other</option>
        </select>
        <label>Message</label>
        <textarea className="input" rows={5} placeholder="Describe what happened…" />
        <button className="btn" type="button" onClick={() => setSent(true)}>Send</button>
        {sent && <p className="success">Thanks — we aim to respond within 24h on reports (PRD trust metric).</p>}
      </div>
      <div className="card">
        <h2>Safety tools</h2>
        <ul className="clean">
          <li>Report content, profiles, messages</li>
          <li>Block and mute</li>
          <li>Keyword filters for Favorites</li>
        </ul>
      </div>
    </div>
  );
}
