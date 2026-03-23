'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { hashValue } from '@/src/lib/api';

function PinDigits({ value, onChange, onComplete, disabled }) {
  const digits = Array(5).fill('');
  const refs = Array(5).fill(null).map(() => null);
  const refList = [];

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const digit = val[val.length - 1];
    const newDigits = value.split('');
    newDigits[index] = digit;
    const newValue = newDigits.join('');
    onChange(newValue);
    if (index < 4) {
      refList[index + 1]?.focus();
    }
    if (newValue.length === 5) {
      onComplete(newValue);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refList[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center my-6">
      {Array(5).fill(0).map((_, i) => (
        <input
          key={i}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          ref={(el) => { refList[i] = el; }}
          className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
        />
      ))}
    </div>
  );
}

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('username');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    setError('');
    setStep('pin');
  };

  const handlePinComplete = async (enteredPin) => {
    setLoading(true);
    setError('');

    try {
      const adminUsernameHash = await hashValue(username);
      const pinHash = await hashValue(enteredPin);

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsernameHash, pinHash }),
      });

      if (!res.ok) {
        setPin('');
        setError('Invalid credentials');
        return;
      }

      sessionStorage.setItem('adminUsernameHash', adminUsernameHash);
      sessionStorage.setItem('adminPinHash', pinHash);
      router.push('/admin/dashboard');
    } catch (err) {
      setPin('');
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Image src="/icon.png" alt="Jumy" width={48} height={48} className="rounded-xl" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Login</h1>
            <p className="text-gray-500 mt-2">
              {step === 'username' ? 'Enter your admin username' : `Welcome, ${username}`}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 'username' && (
            <form onSubmit={handleUsernameSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
              >
                Continue
              </button>
            </form>
          )}

          {step === 'pin' && (
            <div>
              <p className="text-center text-sm text-gray-600 mb-2">Enter your 5-digit PIN</p>
              <PinDigits
                value={pin}
                onChange={setPin}
                onComplete={handlePinComplete}
                disabled={loading}
              />
              {loading && (
                <div className="flex justify-center mt-4">
                  <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <button
                  onClick={() => { setStep('username'); setPin(''); setError(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Use a different account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
