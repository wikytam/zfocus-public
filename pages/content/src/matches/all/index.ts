// Initialize Sentry/GlitchTip error monitoring as early as possible
import { initSentry } from '@extension/shared';
import { sampleFunction } from '@src/sample-function';

initSentry({ context: 'content' });

console.log('[CEB] All content script loaded');

void sampleFunction();

// ZFocus: Capture and send referrer to background script
console.log('[ZFocus Content] Referrer tracker loaded');

if (document.referrer) {
  console.log(`[ZFocus Content] Sending referrer: ${document.referrer} for URL: ${window.location.href}`);
  chrome.runtime
    .sendMessage({
      type: 'REFERRER_CAPTURED',
      referrer: document.referrer,
      url: window.location.href,
    })
    .catch(error => {
      console.error('[ZFocus Content] Failed to send referrer:', error);
    });
} else {
  console.log('[ZFocus Content] No referrer found for URL:', window.location.href);
}
