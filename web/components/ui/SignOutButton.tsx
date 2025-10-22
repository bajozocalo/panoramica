'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
    >
      Sign Out
    </button>
  );
}