import { API_BASE, authHeaders } from '@/lib/api';

export async function pingPresence(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/presence/ping`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  } catch {
    /* réseau indisponible */
  }
}

export function goOffline(token: string): void {
  try {
    fetch(`${API_BASE}/api/presence/offline`, {
      method: 'POST',
      headers: authHeaders(token),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
