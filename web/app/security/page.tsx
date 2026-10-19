'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, setToken } from '@/lib/api';

type Overview = {
  security: {
    twoFactorEnabled: boolean;
    recoveryCodesRemaining: number;
    locked: boolean;
    passwordChangedAt: string | null;
  };
  events: { id: string; type: string; ip: string | null; createdAt: string }[];
  apiKeys: { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string }[];
  phishingTips: string;
};

type SessionRow = { at: string; ip: string | null; userAgent: string | null; method: string };

const EVENT_LABELS: Record<string, string> = {
  login: 'Signed in',
  login_2fa: 'Signed in (2FA)',
  login_recovery_code: 'Signed in (recovery code)',
  login_social: 'Signed in (social)',
  login_failed: 'Failed sign-in',
  lockout: 'Account locked (too many failed attempts)',
  account_created: 'Account created',
  password_changed: 'Password changed',
  password_reset_requested: 'Password reset requested',
  password_reset_completed: 'Password reset completed',
  '2fa_enabled': 'Two-factor enabled',
  '2fa_disabled': 'Two-factor disabled',
  sessions_revoked: 'All sessions signed out',
  api_key_created: 'API key created',
  api_key_revoked: 'API key revoked',
};

export default function SecurityPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // 2FA setup state
  const [setupSecret, setSetupSecret] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [totp, setTotp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // password change
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  // disable 2FA
  const [disable, setDisable] = useState({ password: '', code: '' });
  // API keys
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api<Overview>('/api/security/me');
      setOverview(r);
      const s = await api<{ sessions: SessionRow[] }>('/api/security/sessions');
      setSessions(s.sessions || []);
    } catch (e: any) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startSetup() {
    setErr(''); setMsg(''); setRecoveryCodes(null);
    try {
      const r = await api<{ secret: string; otpauthUri: string }>('/api/security/2fa/setup', { method: 'POST' });
      setSetupSecret(r);
    } catch (e: any) { setErr(e.message); }
  }

  async function enable() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ recoveryCodes: string[] }>('/api/security/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: totp }),
      });
      setSetupSecret(null);
      setTotp('');
      setRecoveryCodes(r.recoveryCodes);
      setMsg('Two-factor enabled. Save your recovery codes now.');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function disable2fa() {
    setErr(''); setMsg('');
    try {
      await api('/api/security/2fa/disable', {
        method: 'POST',
        body: JSON.stringify(disable),
      });
      setDisable({ password: '', code: '' });
      setMsg('Two-factor disabled');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function regenerateCodes() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ recoveryCodes: string[] }>('/api/security/2fa/recovery-codes', {
        method: 'POST',
        body: JSON.stringify({ password: pw.current || undefined }),
      });
      setRecoveryCodes(r.recoveryCodes);
      setMsg('New recovery codes generated. Old ones are invalid.');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function changePassword() {
    setErr(''); setMsg('');
    if (pw.next !== pw.confirm) { setErr('New passwords do not match'); return; }
    try {
      const r = await api<{ token: string }>('/api/security/password/change', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      setToken(r.token); // keep this session signed in
      setPw({ current: '', next: '', confirm: '' });
      setMsg('Password changed. All other sessions were signed out.');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function revokeAll() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ token: string }>('/api/security/sessions/revoke-all', { method: 'POST' });
      setToken(r.token);
      setMsg('All other sessions signed out.');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function createKey() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ key: string }>('/api/security/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: keyName }),
      });
      setNewKey(r.key);
      setKeyName('');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function revokeKey(id: string) {
    setErr('');
    try {
      await api('/api/security/api-keys/' + id + '/revoke', { method: 'POST' });
      load();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div>
      <h1>Security</h1>
      <p className="muted">Protect your account against hacks, phishing, and account takeover.</p>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
      {overview && (
        <>
          <div className="card stack">
            <h2>Two-factor authentication (TOTP)</h2>
            <p>
              <span className="badge">{overview.security.twoFactorEnabled ? 'enabled' : 'disabled'}</span>{' '}
              {overview.security.twoFactorEnabled && (
                <span className="badge">{overview.security.recoveryCodesRemaining} recovery codes left</span>
              )}
            </p>
            {!overview.security.twoFactorEnabled && !setupSecret && (
              <>
                <p className="muted">
                  Add a second factor with Google Authenticator, Authy, 1Password, or any RFC 6238 app.
                  Even if your password leaks, attackers cannot sign in.
                </p>
                <button className="btn" onClick={startSetup}>Set up two-factor</button>
              </>
            )}
            {setupSecret && (
              <div className="stack">
                <p className="muted">1. Add this secret to your authenticator app (manual entry):</p>
                <code style={{ wordBreak: 'break-all' }}>{setupSecret.secret}</code>
                <p className="muted">Or open this URI with your app:</p>
                <code style={{ wordBreak: 'break-all', fontSize: 12 }}>{setupSecret.otpauthUri}</code>
                <p className="muted">2. Enter the 6-digit code it shows:</p>
                <input
                  placeholder="123456"
                  maxLength={6}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  inputMode="numeric"
                  autoFocus
                />
                <div className="row">
                  <button className="btn" onClick={enable} disabled={totp.length !== 6}>Enable two-factor</button>
                  <button className="btn btn-ghost" onClick={() => setSetupSecret(null)}>Cancel</button>
                </div>
              </div>
            )}
            {overview.security.twoFactorEnabled && (
              <div className="stack">
                <div className="row">
                  <input
                    placeholder="Password"
                    type="password"
                    value={disable.password}
                    onChange={(e) => setDisable({ ...disable, password: e.target.value })}
                  />
                  <input
                    placeholder="Authenticator code"
                    value={disable.code}
                    onChange={(e) => setDisable({ ...disable, code: e.target.value })}
                  />
                  <button className="btn btn-ghost" onClick={disable2fa} disabled={!disable.password || disable.code.length < 6}>
                    Disable 2FA
                  </button>
                </div>
                <button className="btn btn-ghost" onClick={regenerateCodes}>Regenerate recovery codes (asks for password)</button>
              </div>
            )}
            {recoveryCodes && (
              <div className="card">
                <h3>Recovery codes — save them now, shown only once</h3>
                <ul style={{ fontFamily: 'monospace' }}>
                  {recoveryCodes.map((c) => <li key={c}>{c}</li>)}
                </ul>
                <p className="muted">Each code signs you in once if you lose your authenticator.</p>
              </div>
            )}
          </div>

          <div className="card stack">
            <h2>Change password</h2>
            <input placeholder="Current password" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <input placeholder="New password (8+ chars, not common)" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <input placeholder="Confirm new password" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            <button className="btn" onClick={changePassword} disabled={!pw.current || !pw.next}>Change password</button>
            <p className="muted">Changing your password signs out every other session immediately.</p>
          </div>

          <div className="card stack">
            <h2>Sessions</h2>
            {sessions.length === 0 && <p className="muted">No recent sign-ins recorded.</p>}
            {sessions.map((s, i) => (
              <p key={i} className="muted">
                {new Date(s.at).toLocaleString()} · {s.method} · {s.ip || 'unknown IP'}
              </p>
            ))}
            <button className="btn btn-ghost" onClick={revokeAll}>Sign out all other sessions</button>
          </div>

          <div className="card stack">
            <h2>Public API keys</h2>
            <p className="muted">
              Keys unlock the higher rate limit on <code>/api/public/v1/*</code>. Send as{' '}
              <code>Authorization: Bearer rly_live_…</code>. Only a hash is stored — the key is shown once.
            </p>
            {newKey && (
              <div className="card">
                <h3>Your new key — copy it now</h3>
                <code style={{ wordBreak: 'break-all' }}>{newKey}</code>
              </div>
            )}
            <div className="row">
              <input placeholder="Key name (e.g. my-site widget)" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
              <button className="btn" onClick={createKey} disabled={!keyName}>Create key</button>
            </div>
            {overview.apiKeys.map((k) => (
              <p key={k.id}>
                <span className="badge">{k.name}</span>{' '}
                <code>{k.keyPrefix}…</code>{' '}
                {k.revokedAt
                  ? <span className="badge">revoked</span>
                  : <button className="btn btn-ghost" onClick={() => revokeKey(k.id)}>Revoke</button>}
                {' '}
                <span className="muted">{k.lastUsedAt ? 'used ' + new Date(k.lastUsedAt).toLocaleDateString() : 'never used'}</span>
              </p>
            ))}
          </div>

          <div className="card stack">
            <h2>Anti-phishing</h2>
            <p className="muted">{overview.phishingTips}</p>
            <p className="muted">
              Recent security events:{' '}
              {overview.events.slice(0, 5).map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ' · '}
                  {(EVENT_LABELS[e.type] || e.type)} ({new Date(e.createdAt).toLocaleDateString()})
                </span>
              ))}
            </p>
          </div>
        </>
      )}
      {!overview && !err && <p className="muted">Loading…</p>}
      {!overview && err && (
        <div className="card">
          <p className="muted"><a href="/login">Log in</a> to manage your security settings.</p>
        </div>
      )}
    </div>
  );
}
