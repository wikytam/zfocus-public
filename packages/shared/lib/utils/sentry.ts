/**
 * Sentry/GlitchTip Error Monitoring Integration for Browser Extensions
 *
 * GlitchTip is an open-source error tracking tool compatible with Sentry SDK.
 * This module provides centralized error capture for all extension contexts.
 *
 * IMPORTANT: For browser extensions, we use BrowserClient and Scope manually
 * instead of Sentry.init() to avoid polluting global state and conflicts
 * with websites that may also use Sentry.
 *
 * @see https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
 */

import { BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope } from '@sentry/browser';

// Environment variables - use process.env directly to avoid build issues with tailwind
const IS_DEV = process.env['CLI_CEB_DEV'] === 'true';
const IS_PROD = !IS_DEV;
const SENTRY_DSN = process.env['CEB_SENTRY_DSN'] || '';

// Track if Sentry has been initialized to prevent double initialization
let isInitialized = false;
let currentContext = '';
// Track if user has given consent (loaded from storage)
let hasUserConsent = false;

// Client and scope for manual capture (browser extension best practice)
let sentryClient: BrowserClient | null = null;
let sentryScope: Scope | null = null;

// Type definitions (exported at end of file per import-x/exports-last rule)
interface SentryConfig {
  /** Context name for identifying where errors come from (e.g., 'background', 'popup', 'options') */
  context: string;
  /** Enable debug mode (default: false in production) */
  debug?: boolean;
  /** Sample rate for performance monitoring (0.0 to 1.0, default: 0.01) */
  tracesSampleRate?: number;
}

/**
 * Check if user has consented to error reporting
 * Reads from chrome.storage.sync
 */
const checkUserConsent = async (): Promise<boolean> => {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return false;
    }
    const result = await chrome.storage.sync.get(['focus-settings']);
    const settings = result['focus-settings'];
    return settings?.errorReportingEnabled === true;
  } catch (error) {
    if (IS_DEV) {
      console.warn('[ZFocus Sentry] Failed to check user consent:', error);
    }
    return false;
  }
};

/**
 * Initialize Sentry/GlitchTip error monitoring for browser extension
 * Uses BrowserClient and Scope manually instead of Sentry.init()
 * to avoid conflicts with websites that may also use Sentry.
 *
 * IMPORTANT: This function now checks for user consent before initializing.
 * Error reporting is OFF by default and must be enabled by the user.
 *
 * @see https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
 * @param config - Configuration options
 */
export const initSentry = async (config: SentryConfig): Promise<void> => {
  if (isInitialized) {
    if (IS_DEV) {
      console.log(`[ZFocus Sentry] Already initialized, skipping for context: ${config.context}`);
    }
    return;
  }

  // Skip initialization if DSN is not configured
  if (!SENTRY_DSN) {
    if (IS_DEV) {
      console.warn('[ZFocus Sentry] DSN not configured, error monitoring disabled');
    }
    return;
  }

  // Check user consent before initializing
  hasUserConsent = await checkUserConsent();
  if (!hasUserConsent) {
    if (IS_DEV) {
      console.log('[ZFocus Sentry] User has not consented to error reporting, skipping initialization');
    }
    return;
  }

  try {
    // Filter integrations that use global state (browser extension best practice)
    // Avoid BrowserApiErrors, Breadcrumbs, GlobalHandlers as they pollute global state
    const integrations = getDefaultIntegrations({}).filter(
      defaultIntegration => !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(defaultIntegration.name),
    );

    // Create isolated client for browser extension
    sentryClient = new BrowserClient({
      dsn: SENTRY_DSN,
      transport: makeFetchTransport,
      stackParser: defaultStackParser,
      integrations: integrations,
      tracesSampleRate: config.tracesSampleRate ?? 0.01,
      debug: config.debug ?? false,
      environment: IS_DEV ? 'development' : 'production',
      release: `zfocus@${process.env.npm_package_version || '0.5.0'}`,

      // Ignore extension context invalidation errors (expected during updates)
      ignoreErrors: [
        'Extension context invalidated',
        'Receiving end does not exist',
        'The message port closed before a response was received',
        'ResizeObserver loop completed with undelivered notifications',
      ],

      // Transform events before sending
      beforeSend(event) {
        // Add extension-specific metadata
        event.tags = {
          ...event.tags,
          context: config.context,
          extension: 'zfocus',
          browser: typeof chrome !== 'undefined' ? 'chrome' : 'unknown',
        };
        return event;
      },
    });

    // Create isolated scope and attach client
    sentryScope = new Scope();
    sentryScope.setClient(sentryClient);

    // Initialize client after setting on scope
    sentryClient.init();

    // Set default tags on scope
    sentryScope.setTags({
      context: config.context,
      extension: 'zfocus',
    });

    isInitialized = true;
    currentContext = config.context;

    if (IS_DEV) {
      console.log(`[ZFocus Sentry] Initialized for context: ${config.context} (browser extension mode)`);
    }
  } catch (error) {
    if (IS_DEV) {
      console.error('[ZFocus Sentry] Failed to initialize:', error);
    }
  }
};

/**
 * Capture an exception manually
 *
 * @param error - The error to capture
 * @param context - Additional context information
 */
export const captureException = (error: Error | unknown, context?: Record<string, unknown>): void => {
  // Check for user consent before capturing
  if (!hasUserConsent) {
    if (IS_DEV) {
      console.log('[ZFocus Sentry] User has not consented to error reporting, skipping exception capture');
    }
    return;
  }

  if (!isInitialized || !sentryScope) {
    if (IS_DEV) {
      console.warn('[ZFocus Sentry] Not initialized, cannot capture exception');
    }
    return;
  }

  if (context) {
    sentryScope.setExtras(context);
  }
  sentryScope.captureException(error);
};

/**
 * Capture a message (for non-error logging)
 *
 * @param message - The message to capture
 * @param level - Severity level
 * @param context - Additional context information
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>,
): void => {
  // Check for user consent before capturing
  if (!hasUserConsent) {
    if (IS_DEV) {
      console.log('[ZFocus Sentry] User has not consented to error reporting, skipping message capture');
    }
    return;
  }

  if (!isInitialized || !sentryScope) {
    if (IS_DEV) {
      console.warn('[ZFocus Sentry] Not initialized, cannot capture message');
    }
    return;
  }

  if (context) {
    sentryScope.setExtras(context);
  }
  sentryScope.setLevel(level);
  sentryScope.captureMessage(message);
};

/**
 * Set user information for error tracking
 *
 * @param user - User information
 */
export const setUser = (user: { id?: string; email?: string; username?: string } | null): void => {
  if (!isInitialized || !sentryScope) {
    return;
  }
  sentryScope.setUser(user);
};

/**
 * Add breadcrumb for debugging context
 *
 * @param breadcrumb - Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb: {
  category?: string;
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void => {
  if (!isInitialized || !sentryScope) {
    return;
  }
  sentryScope.addBreadcrumb(breadcrumb);
};

/**
 * Test error reporting - sends a test error to GlitchTip
 *
 * @returns Promise that resolves when the test is complete
 */
export const testSentryConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!isInitialized || !sentryClient) {
    return {
      success: false,
      message: 'Sentry not initialized. Check if CEB_SENTRY_DSN is configured in .env',
    };
  }

  try {
    // Send a test message
    captureMessage(`[TEST] Sentry connection test from ${currentContext}`, 'info', {
      testTimestamp: new Date().toISOString(),
      context: currentContext,
      isDev: IS_DEV,
      isProd: IS_PROD,
    });

    // Send a test exception
    const testError = new Error(`[TEST] Test error from ZFocus ${currentContext} context`);
    testError.name = 'SentryTestError';
    captureException(testError, {
      testType: 'connection_test',
      context: currentContext,
    });

    // Flush to ensure events are sent
    await sentryClient.flush(2000);

    const message = `Test events sent successfully from ${currentContext} context. Check your GlitchTip dashboard.`;
    if (IS_DEV) {
      console.log(`[ZFocus Sentry] ${message}`);
    }

    return { success: true, message };
  } catch (error) {
    const message = `Failed to send test events: ${error instanceof Error ? error.message : 'Unknown error'}`;
    if (IS_DEV) {
      console.error(`[ZFocus Sentry] ${message}`);
    }
    return { success: false, message };
  }
};

/**
 * Check if Sentry is initialized and ready
 */
export const isSentryReady = (): boolean => isInitialized;

/**
 * Update error reporting consent status
 * If consent is granted and Sentry is not initialized, initialize it
 * If consent is revoked, we can't un-initialize Sentry but we disable further reporting
 *
 * @param enabled - Whether error reporting is enabled
 * @param context - Context name for Sentry initialization
 */
export const updateErrorReportingConsent = async (enabled: boolean, context: string): Promise<void> => {
  hasUserConsent = enabled;

  if (enabled && !isInitialized) {
    // User enabled error reporting, initialize Sentry
    await initSentry({ context });
    if (IS_DEV) {
      console.log('[ZFocus Sentry] Error reporting enabled by user, Sentry initialized');
    }
  } else if (!enabled) {
    // User disabled error reporting
    // We can't truly "uninitialize" Sentry, but we can stop sending events
    // by checking hasUserConsent before capture
    if (IS_DEV) {
      console.log('[ZFocus Sentry] Error reporting disabled by user');
    }
  }
};

/**
 * Check if user has given consent for error reporting
 */
export const hasErrorReportingConsent = (): boolean => hasUserConsent;

/**
 * Get current Sentry status
 */
export const getSentryStatus = (): { initialized: boolean; context: string; dsn: string } => ({
  initialized: isInitialized,
  context: currentContext,
  dsn: SENTRY_DSN ? `${SENTRY_DSN.substring(0, 20)}...` : 'Not configured',
});

/**
 * Get the isolated scope for advanced usage
 * Use this if you need direct access to the Sentry scope
 */
export const getSentryScope = (): Scope | null => sentryScope;

/**
 * Get the isolated client for advanced usage
 * Use this if you need direct access to the Sentry client
 */
export const getSentryClient = (): BrowserClient | null => sentryClient;

// Export types at end of file (import-x/exports-last rule)
export type { SentryConfig };
