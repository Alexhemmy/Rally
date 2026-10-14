'use client';
import { clearToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  return (
    <div>
      <h1>Settings</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Your session stays active while you use Rally. After 7 days of inactivity you will need to log in again.</p>
      <div className="card stack">
        <h2>Account</h2>
        <label>Interface language</label>
        <select className="select" defaultValue="en">
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
          <option value="ar">العربية</option>
          <option value="pcm">Nigerian Pidgin</option>
        </select>
        <label>Content languages</label>
        <input className="input" defaultValue="en" />
        <label>Monthly spend cap (Tokens)</label>
        <input className="input" type="number" placeholder="Optional" />
        <label>
          <input type="checkbox" defaultChecked /> Anonymity default on supporter wall
        </label>
      </div>
      <div className="card stack">
        <h2>Notifications</h2>
        <label><input type="checkbox" defaultChecked /> Tips & gifts</label>
        <label><input type="checkbox" defaultChecked /> New posts / Moments</label>
        <label><input type="checkbox" /> Marketing</label>
        <label><input type="checkbox" defaultChecked /> Quiet hours</label>
      </div>
      <div className="card stack">
        <h2>Safety</h2>
        <a href="/support">Blocked accounts & reports</a>
        <p className="muted">Minors: age gating and restricted spending (PRD §16).</p>
      </div>
      <button
        className="btn btn-danger"
        type="button"
        onClick={() => { clearToken(); router.push('/'); }}
      >
        Log out
      </button>
    </div>
  );
}
