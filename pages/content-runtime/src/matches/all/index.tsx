// Initialize Sentry/GlitchTip error monitoring as early as possible
import inlineCss from '../../../dist/all/index.css?inline';
import { initSentry, initAppWithShadow } from '@extension/shared';
import App from '@src/matches/all/App';

initSentry({ context: 'content-runtime' });

initAppWithShadow({ id: 'CEB-extension-runtime-all', app: <App />, inlineCss });
