export const TOKEN_KEY = 'access_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? null;
}

export function getEmailFromToken(): string | null {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.email || payload.username || null;
  } catch { return null; }
}

export function getUserIdFromToken(): number {
  const token = getStoredToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = payload.userId ?? payload.id ?? payload.user_id ?? 0;
      const n = Number(id);
      if (n > 0) {
        localStorage.setItem('userId', String(n)); // keep in sync
        return n;
      }
    } catch {}
  }

  // Fallback: localStorage only if no token
  const stored = localStorage.getItem('userId');
  if (stored && stored !== 'undefined' && stored !== 'null' && stored !== '0') {
    const n = Number(stored);
    if (n > 0) return n;
  }
  return 0;
}

export function storeUserId(id: number): void {
  localStorage.setItem('userId', String(id));
}