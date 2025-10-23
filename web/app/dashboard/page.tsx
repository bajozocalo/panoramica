'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

import OnboardingModal from '@/components/ui/OnboardingModal';
import { STYLE_OPTIONS, MOOD_OPTIONS } from '@/lib/constants';
import MagicRetouchModal from '@/components/ui/MagicRetouchModal.dynamic';

export default function Dashboard() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMagicRetouch, setShowMagicRetouch] = useState(false);
  const [retouchImageUrl, setRetouchImageUrl] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCloseOnboarding = async () => {
    setShowOnboarding(false);
    if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            'metadata.onboardingCompleted': true
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ... (rest of the dashboard content) */}
      </main>
      <Footer />
    </div>
  );
}
