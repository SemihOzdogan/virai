import { AUTH_SESSION_DURATION_MS, getAuthSessionExpiresAt } from '../src/utils/authSession';

describe('getAuthSessionExpiresAt', () => {
  it('sets the session expiry to seven days after the last sign-in', () => {
    const lastSignInTime = '2026-10-01T12:00:00.000Z';

    expect(getAuthSessionExpiresAt(lastSignInTime)).toBe(
      Date.parse(lastSignInTime) + 7 * 24 * 60 * 60 * 1000,
    );
    expect(AUTH_SESSION_DURATION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns null when the Firebase sign-in time is missing or invalid', () => {
    expect(getAuthSessionExpiresAt(null)).toBeNull();
    expect(getAuthSessionExpiresAt(undefined)).toBeNull();
    expect(getAuthSessionExpiresAt('not-a-date')).toBeNull();
  });
});
