'use client';

import { useEffect } from 'react';

/**
 * Suppresses external Google API errors caused by browser extensions
 * or third-party scripts injecting malformed JSON
 */
export function ErrorSuppressor() {
  useEffect(() => {
    // Suppress specific Google API errors that come from extensions
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorStr = args.join(' ');

      // Filter out known external errors
      if (
        errorStr.includes('Unexpected number in JSON') ||
        errorStr.includes('apis.google.com') ||
        errorStr.includes('gapi.loaded')
      ) {
        // Silently ignore these errors as they come from browser extensions
        return;
      }

      // Log all other errors normally
      originalError.apply(console, args);
    };

    // Also add a global error handler
    const handleError = (event: ErrorEvent) => {
      const errorMsg = event.message || '';

      if (
        errorMsg.includes('Unexpected number in JSON') ||
        errorMsg.includes('apis.google.com') ||
        errorMsg.includes('gapi.loaded')
      ) {
        // Prevent the error from showing in console
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
