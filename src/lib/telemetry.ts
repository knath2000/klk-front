'use client';

/**
 * Lightweight telemetry wrapper.
 *
 * - Uses a global `window.__ROLLBAR__` instance when available.
 * - Exposes `reportError` and `reportEvent` functions that are no-ops on the server
 *   and fall back to console output when Rollbar isn't available.
 *
 * This file intentionally avoids importing @rollbar/browser directly so the package
 * is optional and the client build will not fail if it's not installed.
 */

type RollbarInstance = any;

let rollbar: RollbarInstance | null = null;
let rollbarInitCalled = false;

function initRollbarOnce(): void {
  if (typeof window === 'undefined') return;
  if (rollbarInitCalled) return;
  rollbarInitCalled = true;

  // Prefer an already-initialized Rollbar instance exposed on window by the host app.
  // This keeps the telemetry integration optional and avoids requiring @rollbar/browser
  // as a build-time dependency.
  // If you want to enable Rollbar, boot it in your HTML or a runtime script and set:
  //   window.__ROLLBAR__ = new Rollbar({ accessToken: '...', ... });
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win && win.__ROLLBAR__) {
      rollbar = win.__ROLLBAR__;
      // eslint-disable-next-line no-console
      console.info('[telemetry] using window.__ROLLBAR__ instance');
      return;
    }
  } catch (err) {
    // ignore
  }

  // No telemetry backend configured; leave rollbar null to use console fallback.
  // eslint-disable-next-line no-console
  console.info('[telemetry] Rollbar not configured; telemetry will use console fallback');
}

export async function reportError(err: unknown, context?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  initRollbarOnce();
  if (rollbar) {
    try {
      rollbar.error(err, context);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[telemetry] rollbar.error failed', e);
    }
  } else {
    // fallback console
    // eslint-disable-next-line no-console
    console.error('[telemetry] error', err, context ?? '');
  }
}

export async function reportEvent(name: string, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  initRollbarOnce();
  if (rollbar) {
    try {
      rollbar.info(name, payload);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[telemetry] rollbar.info failed', e);
    }
  } else {
    // eslint-disable-next-line no-console
    console.info(`[telemetry] event ${name}`, payload ?? '');
  }
}