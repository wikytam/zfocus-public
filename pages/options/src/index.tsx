import '@src/index.css';
import Options from '@src/Options';
import { createRoot } from 'react-dom/client';

const init = () => {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }

  // Ensure we only create the root once
  if (appContainer.hasAttribute('data-react-root')) {
    console.warn('[ZFocus Options] React root already initialized, skipping');
    return;
  }

  appContainer.setAttribute('data-react-root', 'true');
  const root = createRoot(appContainer);
  root.render(<Options />);

  // Show content after React loads (prevents flash)
  requestAnimationFrame(() => {
    appContainer.classList.add('loaded');
  });
};

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
