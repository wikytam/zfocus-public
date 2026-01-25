import type { Plugin } from 'vite';

/**
 * Vite plugin to wrap content script IIFE in a CSP-safe try-catch wrapper.
 * This prevents React's vendor prefix detection from throwing on sites with strict CSP
 * that cause document.createElement('div').style to return undefined.
 * Also handles SVG documents where HTML elements may not work correctly.
 * @see https://github.com/facebook/react/issues/26777
 */
export const cspSafeWrapper = (): Plugin => ({
  name: 'csp-safe-wrapper',
  generateBundle(_, bundle) {
    for (const fileName in bundle) {
      const chunk = bundle[fileName];
      if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
        // Wrap the entire IIFE in a CSP check and try-catch
        // The check is comprehensive to handle:
        // 1. Strict CSP pages where style is undefined
        // 2. SVG documents where HTML elements don't work properly
        // 3. Other edge cases where React can't initialize
        const wrapper = `(function(){
  try {
    // Skip on non-HTML documents (SVG, XML, etc.) where React can't initialize properly
    if (document.contentType && document.contentType !== 'text/html' && 
        !document.contentType.includes('xhtml')) {
      console.log('[ZFocus] Skipping content script on non-HTML document:', document.contentType);
      return;
    }
    // Skip if document.body doesn't exist (e.g., SVG documents)
    if (!document.body) {
      console.log('[ZFocus] Skipping content script - no document body');
      return;
    }
    // Check for CSP restrictions before executing React code
    var testDiv = document.createElement('div');
    if (!testDiv.style || typeof testDiv.style !== 'object' || !('animation' in testDiv.style)) {
      console.log('[ZFocus] Skipping content script on page with strict CSP restrictions');
      return;
    }
  } catch (e) {
    console.log('[ZFocus] Skipping content script due to error:', e.message);
    return;
  }
  try {
`;
        const footer = `
  } catch (e) {
    if (e.message && e.message.includes("'in' operator")) {
      console.log('[ZFocus] Content script blocked by page CSP restrictions');
    } else {
      console.warn('[ZFocus] Content script error:', e);
    }
  }
})();`;
        // Remove the existing IIFE wrapper and add our own
        let code = chunk.code;
        // Match patterns like (function(){...})(); or (function(){"use strict";...})();
        const iifeMatch = code.match(/^\(function\(\)\s*\{("use strict";)?/);
        if (iifeMatch) {
          // Remove opening IIFE
          code = code.replace(/^\(function\(\)\s*\{("use strict";)?/, '');
          // Remove closing IIFE - handle both })(); and }());
          code = code.replace(/\}\)\(\);?\s*$/, '').replace(/\}\(\)\);?\s*$/, '');
          chunk.code = wrapper + '"use strict";' + code + footer;
        }
      }
    }
  },
});
