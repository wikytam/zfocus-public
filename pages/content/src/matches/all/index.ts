// Initialize Sentry/GlitchTip error monitoring as early as possible
import { initSentry } from '@extension/shared';
import { sampleFunction } from '@src/sample-function';

initSentry({ context: 'content' });

console.log('[CEB] All content script loaded');

void sampleFunction();
