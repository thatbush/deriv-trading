import { describe, it, expect } from 'vitest';
import { isAuthRejection, OAuthError } from '@deriv/core';

describe('isAuthRejection', () => {
  it('true for 401 / 403 OAuthError (genuine auth rejection)', () => {
    expect(isAuthRejection(new OAuthError('unauthorized', 401))).toBe(true);
    expect(isAuthRejection(new OAuthError('forbidden', 403))).toBe(true);
  });

  it('false for transient failures (no status, 5xx, network/abort)', () => {
    expect(isAuthRejection(new OAuthError('server error', 503))).toBe(false);
    expect(isAuthRejection(new OAuthError('no status'))).toBe(false);
    expect(isAuthRejection(new TypeError('Failed to fetch'))).toBe(false);
    expect(isAuthRejection(new DOMException('aborted', 'AbortError'))).toBe(false);
    expect(isAuthRejection(undefined)).toBe(false);
  });
});
