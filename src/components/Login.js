'use client';

import { useState } from 'react';
import Image from 'next/image';
import { login } from '@/src/lib/api';

export default function Login({ onProceed, onBack, onRegister }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { usernameHash } = await login(username);
      onProceed(usernameHash);
    } catch (err) {
      setError('Username not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Image src="/icon.png" alt="Jumy" width={48} height={48} className="rounded-xl" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Sign In</h1>
        <p className="text-gray-500 mt-2">Enter your username to continue</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            autoComplete="off"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-xl transition-colors"
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
      </form>
      
      <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
        <p className="text-sm text-gray-500">
          Don't have an account?{' '}
          <button onClick={onRegister} className="text-violet-600 hover:text-violet-700 font-medium">
            Create one
          </button>
        </p>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back to Welcome
        </button>
      </div>
    </div>
  );
}
