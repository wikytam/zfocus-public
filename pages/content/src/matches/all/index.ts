import { sampleFunction } from '@src/sample-function';

console.log('[CEB] All content script loaded');

void sampleFunction();

// FocusGuard: Capture and send referrer to background script
console.log('[FocusGuard Content] Referrer tracker loaded');

if (document.referrer) {
  console.log(`[FocusGuard Content] Sending referrer: ${document.referrer} for URL: ${window.location.href}`);
  chrome.runtime
    .sendMessage({
      type: 'REFERRER_CAPTURED',
      referrer: document.referrer,
      url: window.location.href,
    })
    .catch(error => {
      console.error('[FocusGuard Content] Failed to send referrer:', error);
    });
} else {
  console.log('[FocusGuard Content] No referrer found for URL:', window.location.href);
}
