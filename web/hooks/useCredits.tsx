'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreditContextType {
  credits: number | null;
  loading: boolean;
}

const CreditContext = createContext<CreditContextType>({ credits: null, loading: true });

export const CreditProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setCredits(doc.data().credits);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setCredits(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <CreditContext.Provider value={{ credits, loading }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => useContext(CreditContext);
