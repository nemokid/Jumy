'use client';

import Image from 'next/image';

export default function Welcome({ onLogin, onRegister }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image 
            src="/icon.png" 
            alt="Jumy" 
            width={80} 
            height={80} 
            className="rounded-2xl shadow-lg"
          />
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Jumy</h1>
        <p className="text-gray-500">We know nothing but privacy</p>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={onLogin}
          className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={onRegister}
          className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-colors"
        >
          Create Account
        </button>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400">
          No email. No phone number. Just privacy.
        </p>
      </div>
    </div>
  );
}
