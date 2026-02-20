'use client';

import { useState } from 'react';
import PinInput from './PinInput';
import { wipeAccount } from '@/src/lib/api';

export default function Wipe({ session, onWiped }) {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinComplete = async (enteredPin) => {
    setLoading(true);
    setError('');
    
    try {
      await wipeAccount(session.usernameHash, enteredPin, session.fakeMode);
      onWiped();
    } catch (err) {
      setError(err.message || 'Failed to wipe account');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-red-600 mb-2">Wipe Account</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {step === 1 && (
        <>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-4">
            <p className="font-medium text-red-800 mb-3">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-red-700 text-sm mb-3">Wiping your account will permanently delete:</p>
            <ul className="text-red-700 text-sm list-disc list-inside space-y-1 mb-3">
              <li>Your account</li>
              <li>All messages in your inbox</li>
              <li>All file attachments</li>
              <li>All data associated with your username</li>
            </ul>
            <p className="text-red-700 text-sm">
              After wiping, you will be signed out and your username will become available for anyone else to register.
            </p>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
            >
              I understand, continue
            </button>
          </div>
        </>
      )}
      
      {step === 2 && (
        <div className="mt-6">
          <p className="text-gray-500 mb-6">Enter your PIN to confirm</p>
          <PinInput value={pin} onChange={setPin} onComplete={handlePinComplete} disabled={loading} />
          
          {loading && (
            <div className="flex justify-center mt-6">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <button
            onClick={() => setStep(1)}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Go back
          </button>
        </div>
      )}
    </div>
  );
}
