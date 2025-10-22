'use client';

import { useCredits } from '@/hooks/useCredits';
import { Skeleton } from './skeleton';

export default function CreditBalance() {
  const { credits, loading } = useCredits();

  if (loading) {
    return <Skeleton className="h-6 w-24" />;
  }

  return (
    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Credits: {credits ?? 0}
    </div>
  );
}