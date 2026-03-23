'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { hashValue } from '@/src/lib/api';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  const [targetUsername, setTargetUsername] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [accountUsername, setAccountUsername] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'clear' | 'delete'

  const getCredentials = useCallback(() => {
    const adminUsernameHash = sessionStorage.getItem('adminUsernameHash');
    const adminPinHash = sessionStorage.getItem('adminPinHash');
    return { adminUsernameHash, adminPinHash };
  }, []);

  const fetchStats = useCallback(async () => {
    const { adminUsernameHash, adminPinHash } = getCredentials();
    if (!adminUsernameHash || !adminPinHash) {
      router.replace('/admin');
      return;
    }

    setLoadingStats(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsernameHash, pinHash: adminPinHash }),
      });

      if (res.status === 401) {
        sessionStorage.removeItem('adminUsernameHash');
        sessionStorage.removeItem('adminPinHash');
        router.replace('/admin');
        return;
      }

      if (!res.ok) {
        setError('Failed to load stats');
        return;
      }

      setStats(await res.json());
    } catch (err) {
      setError('Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  }, [getCredentials, router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSetPermanent = async (isPermanent) => {
    if (!targetUsername.trim()) {
      setActionError('Please enter a username');
      return;
    }

    const { adminUsernameHash, adminPinHash } = getCredentials();
    if (!adminUsernameHash || !adminPinHash) {
      router.replace('/admin');
      return;
    }

    setActionLoading(true);
    setActionMsg('');
    setActionError('');

    try {
      const targetUsernameHash = await hashValue(targetUsername);

      const res = await fetch('/api/admin/set-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsernameHash, pinHash: adminPinHash, targetUsernameHash, isPermanent }),
      });

      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || 'Failed to update user');
        return;
      }

      setActionMsg(isPermanent
        ? `"${targetUsername}" is now a permanent account.`
        : `"${targetUsername}" permanent status revoked.`
      );
      setTargetUsername('');
      fetchStats();
    } catch (err) {
      setActionError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccountAction = async (action) => {
    if (!accountUsername.trim()) {
      setAccountError('Please enter a username');
      return;
    }

    const { adminUsernameHash, adminPinHash } = getCredentials();
    if (!adminUsernameHash || !adminPinHash) {
      router.replace('/admin');
      return;
    }

    if ((action === 'clear' || action === 'delete') && pendingAction !== action) {
      setPendingAction(action);
      return;
    }

    setAccountLoading(true);
    setAccountMsg('');
    setAccountError('');
    setPendingAction(null);

    try {
      const targetUsernameHash = await hashValue(accountUsername);

      if (action === 'export') {
        const res = await fetch('/api/admin/export-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminUsernameHash, pinHash: adminPinHash, targetUsernameHash }),
        });

        if (!res.ok) {
          const data = await res.json();
          setAccountError(data.error || 'Export failed');
          return;
        }

        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jumy-export-${accountUsername.trim().toLowerCase()}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setAccountMsg(`Exported ${data.messages.length} message(s) for "${accountUsername}".`);
        setAccountUsername('');
        return;
      }

      const endpoint = action === 'clear' ? '/api/admin/clear-account' : '/api/admin/delete-account';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsernameHash, pinHash: adminPinHash, targetUsernameHash }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAccountError(data.error || 'Action failed');
        return;
      }

      const data = await res.json();
      if (action === 'clear') {
        setAccountMsg(`Cleared ${data.deletedMessages} message(s) for "${accountUsername}".`);
      } else {
        setAccountMsg(`Account "${accountUsername}" has been deleted.`);
      }
      setAccountUsername('');
      fetchStats();
    } catch (err) {
      setAccountError('Something went wrong');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminUsernameHash');
    sessionStorage.removeItem('adminPinHash');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="Jumy" width={36} height={36} className="rounded-xl" />
          <div>
            <span className="font-semibold text-gray-900">Jumy</span>
            <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loadingStats}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {loadingStats ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Users Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Users</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total users" value={stats?.users.total} />
            <StatCard label="Permanent" value={stats?.users.permanent} sub="never auto-delete" />
            <StatCard label="Active (24h)" value={stats?.users.active24h} />
            <StatCard label="Active (7d)" value={stats?.users.active7d} />
            <StatCard label="Active (30d)" value={stats?.users.active30d} />
          </div>
        </section>

        {/* Messages Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Messages Sent</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Last 24h" value={stats?.messages.sent24h} />
            <StatCard label="Last 7d" value={stats?.messages.sent7d} />
            <StatCard label="Last 30d" value={stats?.messages.sent30d} />
            <StatCard label="Last 90d" value={stats?.messages.sent90d} />
            <StatCard label="With attachments" value={stats?.messages.withAttachments} sub="currently stored" />
          </div>
        </section>

        {/* Storage Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Storage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total blob storage used"
              value={stats ? formatBytes(stats.storage.totalBytes) : null}
              sub="live attachments only"
            />
          </div>
        </section>

        {/* Account Management */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Management</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-4">
              Enter the exact account username to clear its messages, delete it entirely, or export its data.
            </p>

            {accountMsg && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {accountMsg}
              </div>
            )}
            {accountError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {accountError}
              </div>
            )}

            <input
              type="text"
              value={accountUsername}
              onChange={(e) => { setAccountUsername(e.target.value); setAccountMsg(''); setAccountError(''); setPendingAction(null); }}
              placeholder="Enter username"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm mb-3"
              autoComplete="off"
            />

            {pendingAction && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {pendingAction === 'clear'
                  ? `This will permanently delete all messages for "${accountUsername}". The account itself will remain.`
                  : `This will permanently delete the account "${accountUsername}" and all its messages.`
                }
                {' '}Are you sure?
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAccountAction(pendingAction)}
                    disabled={accountLoading}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {accountLoading ? 'Processing…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setPendingAction(null)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleAccountAction('clear')}
                disabled={accountLoading || !!pendingAction}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Clear Messages
              </button>
              <button
                onClick={() => handleAccountAction('delete')}
                disabled={accountLoading || !!pendingAction}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Delete Account
              </button>
              <button
                onClick={() => handleAccountAction('export')}
                disabled={accountLoading || !!pendingAction}
                className="flex-1 py-2.5 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-colors"
              >
                {accountLoading ? 'Exporting…' : 'Export'}
              </button>
            </div>
          </div>
        </section>

        {/* Permanent Account Controls */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Permanent Account Controls</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-4">
              Permanent accounts are never auto-deleted regardless of inactivity.
            </p>

            {actionMsg && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {actionMsg}
              </div>
            )}
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {actionError}
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => { setTargetUsername(e.target.value); setActionMsg(''); setActionError(''); }}
                placeholder="Enter username"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => handleSetPermanent(true)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {actionLoading ? 'Updating…' : 'Make Permanent'}
              </button>
              <button
                onClick={() => handleSetPermanent(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-colors"
              >
                Revoke Permanent
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
