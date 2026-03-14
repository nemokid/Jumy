'use client';

import { useState, useCallback } from 'react';
import Welcome from '@/src/components/Welcome';
import Register from '@/src/components/Register';
import Login from '@/src/components/Login';
import PinEntry from '@/src/components/PinEntry';
import AppShell from '@/src/components/AppShell';

const features = [
  {
    icon: '🔒',
    title: 'Zero data collected',
    description: 'No email, phone number, or personal information required. We literally know nothing about you.',
  },
  {
    icon: '🔐',
    title: 'End-to-end encrypted',
    description: 'Messages and files are encrypted in your browser before being sent. Only the recipient can read them.',
  },
  {
    icon: '⏱️',
    title: 'Auto-deletes in 24h',
    description: 'Messages disappear from our servers after 24 hours, read or unread. No trace left behind.',
  },
  {
    icon: '🛡️',
    title: 'Fake mode protection',
    description: 'If someone enters the wrong PIN, the app looks normal but shows fake data — protecting you under coercion.',
  },
  {
    icon: '📎',
    title: 'Encrypted file attachments',
    description: 'Send files up to 10MB, encrypted in your browser before upload and decrypted only on the recipient\'s device.',
  },
  {
    icon: '👤',
    title: 'Anonymous by design',
    description: 'Your identity is just a username and a 5-digit PIN. If you forget them, no one can recover them — not even us.',
  },
];

export default function Home() {
  const [view, setView] = useState('welcome');
  const [session, setSession] = useState(null);
  const [pendingLogin, setPendingLogin] = useState(null);

  const handleRegisterSuccess = useCallback((sessionData) => {
    setSession(sessionData);
    setView('app');
  }, []);

  const handleLoginStart = useCallback((usernameHash, username) => {
    setPendingLogin({ usernameHash, username });
    setView('pin');
  }, []);

  const handlePinVerified = useCallback((sessionData) => {
    setSession(sessionData);
    setPendingLogin(null);
    setView('app');
  }, []);

  const handleLogout = useCallback(() => {
    setSession(null);
    setPendingLogin(null);
    setView('welcome');
  }, []);

  const handleBack = useCallback(() => {
    setView('welcome');
    setPendingLogin(null);
  }, []);

  if (view === 'app' && session) {
    return <AppShell session={session} onLogout={handleLogout} />;
  }

  if (view !== 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
        <div className="w-full max-w-md">
          {view === 'register' && (
            <Register
              onSuccess={handleRegisterSuccess}
              onBack={handleBack}
            />
          )}

          {view === 'login' && (
            <Login
              onProceed={handleLoginStart}
              onBack={handleBack}
              onRegister={() => setView('register')}
            />
          )}

          {view === 'pin' && pendingLogin && (
            <PinEntry
              usernameHash={pendingLogin.usernameHash}
              username={pendingLogin.username}
              onSuccess={handlePinVerified}
              onBack={() => setView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="max-w-md mx-auto mb-16">
          <Welcome
            onLogin={() => setView('login')}
            onRegister={() => setView('register')}
          />
        </div>

        <div className="mb-10 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Why Jumy?</h2>
          <p className="text-gray-500 text-sm">Private messaging built for people who take their privacy seriously.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-12">
          No account? No problem — create one in seconds. No email. No phone number. Just privacy.
        </p>
      </div>
    </div>
  );
}
