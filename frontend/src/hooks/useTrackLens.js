'use client';

import { useCallback } from 'react';

let _sdk = null;

async function getSDK() {
  if (_sdk) return _sdk;
  try {
    const mod = await import('@tracklens/web-sdk');
    _sdk = mod.default;
    return _sdk;
  } catch {
    return null;
  }
}

export function useTrackLens() {
  const track = useCallback(async (event, properties = {}) => {
    if (typeof window === 'undefined') return;
    const sdk = await getSDK();
    if (!sdk) return;
    try {
      sdk.track(event, { ...properties, timestamp: Date.now() });
    } catch {}
  }, []);

  const identify = useCallback(async (userId, traits = {}) => {
    if (typeof window === 'undefined') return;
    const sdk = await getSDK();
    if (!sdk) return;
    try {
      sdk.identify(userId, traits);
    } catch {}
  }, []);

  const page = useCallback(async (name, properties = {}) => {
    if (typeof window === 'undefined') return;
    const sdk = await getSDK();
    if (!sdk) return;
    try {
      sdk.page(name, properties);
    } catch {}
  }, []);

  return { track, identify, page };
}
