'use client';

import { useState } from 'react';
import Image from 'next/image';
import PinInput from './PinInput';
import { checkUsername, register } from '@/src/lib/api';

export default function Register({ onSuccess, onBack }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await checkUsername(username);
      if (result.exists) {
        setError('This username is already taken');
      } else {
        setStep(2);
      }
    } catch (err) {
      setError('Failed to check username');
    } finally {
      setLoading(false);
    }
  };

  const handlePinComplete = (enteredPin) => {
    setPin(enteredPin);
    setStep(3);
  };

  const handleConfirmPinComplete = async (enteredConfirmPin) => {
    if (enteredConfirmPin !== pin) {
      setError('PINs do not match');
      setPin('');
      setConfirmPin('');
      setStep(2);
      return;
    }
    
    if (!termsAccepted) {
      setError('Please accept the terms');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { usernameHash, pinHash } = await register(username, pin);
      onSuccess({ usernameHash, pinHash, fakeMode: false });
    } catch (err) {
      setError(err.message || 'Registration failed');
      setStep(1);
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
        <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {step === 1 && (
        <form onSubmit={handleUsernameSubmit}>
          <p className="text-gray-500 text-center mb-6">Choose a unique username</p>
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
      )}
      
      {step === 2 && (
        <div>
          <p className="text-gray-500 text-center mb-6">Choose a 5-digit PIN</p>
          <PinInput value={pin} onChange={setPin} onComplete={handlePinComplete} disabled={loading} />
          <p className="text-sm text-gray-400 text-center mt-4">
            Remember this PIN. We cannot recover it.
          </p>
        </div>
      )}
      
      {step === 3 && (
        <div>
          <p className="text-gray-500 text-center mb-6">Confirm your PIN</p>
          <PinInput value={confirmPin} onChange={setConfirmPin} onComplete={handleConfirmPinComplete} disabled={loading} />
          
          <label className="flex items-start gap-3 mt-6 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
            />
            <span className="text-sm text-gray-500">
              I understand that Jumy cannot recover my credentials, and messages are deleted after 24 hours.
            </span>
          </label>
        </div>
      )}
      
      {loading && step === 3 && (
        <div className="flex justify-center mt-4">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Welcome
        </button>
      </div>
    </div>
  );
}
