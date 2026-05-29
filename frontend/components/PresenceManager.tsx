"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { goOffline, pingPresence } from '@/lib/presence';

const PING_INTERVAL_MS = 25_000;

export function PresenceManager() {
  const { user } = useAuth();
  const token = user?.token;

  useEffect(() => {
    if (!token) return;

    const ping = () => pingPresence(token);
    ping();

    const intervalId = window.setInterval(ping, PING_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisible);

    const onUnload = () => goOffline(token);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
      goOffline(token);
    };
  }, [token]);

  return null;
}
