'use client';

import { useState, useCallback } from 'react';
import Welcome from '@/src/components/Welcome';
import Register from '@/src/components/Register';
import Login from '@/src/components/Login';
import PinEntry from '@/src/components/PinEntry';
import AppShell from '@/src/components/AppShell';

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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="w-full max-w-md">
        {view === 'welcome' && (
          <Welcome 
            onLogin={() => setView('login')} 
            onRegister={() => setView('register')} 
          />
        )}
        
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
