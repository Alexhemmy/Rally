/** Security
 * Two-factor authentication, password change, session control & recent activity.
 * Clean, trustworthy, and theme-aware.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Pressable,
} from 'react-native';
import { api, setToken } from '@/lib/api';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Overview = {
  security: {
    twoFactorEnabled: boolean;
    recoveryCodesRemaining: number;
    locked: boolean;
  };
  events: { id: string; type: string; createdAt: string }[];
  phishingTips: string;
};

const EVENT_LABELS: Record<string, string> = {
  login: 'Signed in',
  login_2fa: 'Signed in (2FA)',
  login_failed: 'Failed sign-in',
  lockout: 'Account locked',
  password_changed: 'Password changed',
  '2fa_enabled': 'Two-factor enabled',
  '2fa_disabled': 'Two-factor disabled',
  sessions_revoked: 'Sessions signed out',
};

export default function SecurityScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [totp, setTotp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<Overview>('/api/security/me');
      setOverview(r);
      setMsg(null);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to load security settings' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startSetup() {
    setMsg(null);
    setLoadingAction('setup');
    try {
      const r = await api<{ secret: string }>('/api/security/2fa/setup', { method: 'POST' });
      setSetupSecret(r.secret);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoadingAction(null);
    }
  }

  async 
