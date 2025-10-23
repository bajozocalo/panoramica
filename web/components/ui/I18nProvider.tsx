'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import LanguageDetector from 'i18next-browser-languagedetector';

// This component ensures that the language detector, which relies on browser APIs,
// is only initialized on the client-side.
export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n
        .use(LanguageDetector)
        .init({
          // Re-initialize with client-side settings if needed,
          // but the main config from i18n.ts is usually sufficient.
          // The key is to apply the LanguageDetector middleware here.
        });
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
