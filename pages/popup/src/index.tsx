import '@src/index.css';
import Popup from '@src/Popup';
import { createRoot } from 'react-dom/client';

const init = () => {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(<Popup />);

  // Show content after React loads (prevents flash)
  requestAnimationFrame(() => {
    appContainer.classList.add('loaded');
  });
};

init();
