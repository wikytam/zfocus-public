// Initialize Sentry/GlitchTip error monitoring as early as possible
import { initSentry } from '@extension/shared';
import '@src/index.css';
import SidePanel from '@src/SidePanel';
import { createRoot } from 'react-dom/client';

initSentry({ context: 'side-panel' });

const init = () => {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }

  // Ensure we only create the root once
  if (appContainer.hasAttribute('data-react-root')) {
    console.warn('[ZFocus SidePanel] React root already initialized, skipping');
    return;
  }

  appContainer.setAttribute('data-react-root', 'true');
  const root = createRoot(appContainer);
  root.render(<SidePanel />);
};

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
