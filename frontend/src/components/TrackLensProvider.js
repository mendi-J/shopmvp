'use client';

import { useEffect } from 'react';

/**
 * Initializes the TrackLens SDK on the client side.
 * Reads NEXT_PUBLIC_TRACKLENS_KEY and NEXT_PUBLIC_TRACKLENS_INGEST_URL from env.
 * No-ops if the key is not configured.
 */
export default function TrackLensProvider() {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_TRACKLENS_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_TRACKLENS_API_URL;

    if (!apiKey) return;

    import('@tracklens/web-sdk').then(({ default: TrackLens }) => {
      TrackLens.init({
        apiKey,
        apiUrl,
        environment: process.env.NEXT_PUBLIC_TRACKLENS_ENV || 'production',
        autoTrack: true,
        // Enable SDK console diagnostics (upload sizes, request lifecycle, replay
        // batches) via env flag so it can be turned on per-deployment without a
        // code change. Set NEXT_PUBLIC_TRACKLENS_DEBUG=true in Vercel to activate.
        debug: process.env.NEXT_PUBLIC_TRACKLENS_DEBUG === 'true',
      });
    }).catch((err) => console.error('[TrackLens] init failed:', err));
  }, []);

  return null;
}
