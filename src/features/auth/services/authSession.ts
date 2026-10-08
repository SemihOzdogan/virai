export const AUTH_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function getAuthSessionExpiresAt(lastSignInTime: string | null | undefined) {
  if (!lastSignInTime) {
    return null;
  }

  const lastSignInAt = Date.parse(lastSignInTime);
  return Number.isFinite(lastSignInAt) ? lastSignInAt + AUTH_SESSION_DURATION_MS : null;
}
