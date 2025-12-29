import inlineCss from '../../../dist/all/index.css?inline';
import { initAppWithShadow } from '@extension/shared';
import App from '@src/matches/all/App';
import { Component } from 'react';
import type { ReactNode } from 'react';

// Error boundary to catch extension context invalidation
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log error but don't show UI - extension will reload
    if (error.message.includes('Extension context invalidated')) {
      console.log('[FocusGuard Content-UI] Extension context invalidated, will reload');
    } else {
      console.error('[FocusGuard Content-UI] Error:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Don't render anything on error
    }
    return this.props.children;
  }
}

initAppWithShadow({
  id: 'CEB-extension-all',
  app: (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  ),
  inlineCss,
});
