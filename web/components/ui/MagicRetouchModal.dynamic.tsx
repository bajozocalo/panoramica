'use client';

import dynamic from 'next/dynamic';

const MagicRetouchModal = dynamic(() => import('@/components/ui/MagicRetouchModal'), {
  ssr: false,
});

export default MagicRetouchModal;
