'use client';

import { useState } from 'react';
import Image from 'next/image';
import PinInput from './PinInput';
import { verifyPin } from '@/src/lib/api';

export default function PinEntry({ usernameHash, username, onSuccess, onBack }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinComplete = async (enteredPin) => {
    setLoading(true);
    
    try {
      const result = await verifyPin(usernameHash, enteredPin);
      onSuccess({
        usernameHash,
        pinHash: result.pinHash,
        fakeMode: result.fakeMode,
        username
      });
    } catch (err) {
      console.error('PIN verification error:', err);
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
        <h1 className="text-2xl font-semibold text-gray-900">Enter PIN</h1>
        <p className="text-gray-500 mt-2">Enter your 5-digit PIN</p>
      </div>
      
      <PinInput value={pin} onChange={setPin} onComplete={handlePinComplete} disabled={loading} />
      
      {loading && (
        <div className="flex justify-center mt-6">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
          ← Use a different account
        </button>
      </div>
    </div>
  );
}
