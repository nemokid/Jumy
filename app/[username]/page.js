'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;

  useEffect(() => {
    if (username && typeof username === 'string') {
      sessionStorage.setItem('pendingRecipient', username);
    }
    router.replace('/');
  }, [username, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <p className="text-gray-400 text-sm">Redirecting…</p>
    </div>
  );
}
