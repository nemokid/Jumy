'use client';

import { useState } from 'react';
import PinInput from './PinInput';
import { changePin } from '@/src/lib/api';

export default function ChangePin({ session, onSuccess }) {
  const [step, setStep] = useState(1);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCurrentPinComplete = (pin) => {
    setCurrentPin(pin);
    setStep(2);
  };

  const handleNewPinComplete = (pin) => {
    setNewPin(pin);
    setStep(3);
  };

  const handleConfirmPinComplete = async (pin) => {
    if (pin !== newPin) {
      setError('PINs do not match');
      setNewPin('');
      setConfirmPin('');
      setStep(2);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await changePin(session.usernameHash, currentPin, newPin, session.fakeMode);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to change PIN');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">PIN Changed</h2>
        <p className="text-gray-500 mb-6">Your PIN has been updated successfully.</p>
        <button
          onClick={onSuccess}
          className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Change PIN</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {step === 1 && (
        <div className="mt-6">
          <p className="text-gray-500 mb-6">Enter your current PIN</p>
          <PinInput value={currentPin} onChange={setCurrentPin} onComplete={handleCurrentPinComplete} disabled={loading} />
        </div>
      )}
      
      {step === 2 && (
        <div className="mt-6">
          <p className="text-gray-500 mb-6">Enter your new PIN</p>
          <PinInput value={newPin} onChange={setNewPin} onComplete={handleNewPinComplete} disabled={loading} />
        </div>
      )}
      
      {step === 3 && (
        <div className="mt-6">
          <p className="text-gray-500 mb-6">Confirm your new PIN</p>
          <PinInput value={confirmPin} onChange={setConfirmPin} onComplete={handleConfirmPinComplete} disabled={loading} />
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center mt-6">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
