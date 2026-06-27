'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { useTrackLens } from '../hooks/useTrackLens';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { track } = useTrackLens();

  useEffect(() => {
    const consent = localStorage.getItem('shopmvp_cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('shopmvp_cookie_consent', 'accepted');
    setVisible(false);
    track('Cookie Consent Given', { choice: 'accepted' });
  };

  const decline = () => {
    localStorage.setItem('shopmvp_cookie_consent', 'declined');
    setVisible(false);
    track('Cookie Consent Given', { choice: 'declined' });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">We use cookies</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              We use cookies to improve your experience and analyse site usage.{' '}
              <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Accept All
          </button>
        </div>
        <button onClick={decline} className="absolute top-3 right-3 sm:hidden text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
