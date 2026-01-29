import { Button } from '../ui/button';
import { testSentryConnection, isSentryReady } from '@extension/shared';
import { focusHistoricalStatsStorage, focusStatsStorage } from '@extension/storage';
import { useState } from 'react';

// Check dev mode directly from process.env to avoid tailwind build issues
const IS_DEV = process.env['CLI_CEB_DEV'] === 'true';

export const SeedDataButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Only render in development mode
  if (!IS_DEV) {
    return null;
  }

  const seedData = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Generate historical stats for last 30 days
      const historicalStats: Record<
        string,
        { blockedAttempts: number; timePausedSeconds: number; sitesAccessed: Record<string, number> }
      > = {};
      const today = new Date();

      for (let i = 29; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        // Generate random but realistic data
        const blockedAttempts = Math.floor(Math.random() * 20) + 5; // 5-25 attempts
        const timePausedSeconds = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes

        historicalStats[dateString] = {
          blockedAttempts,
          timePausedSeconds,
          sitesAccessed: {
            'youtube.com': Math.floor(Math.random() * 10) + 1,
            'facebook.com': Math.floor(Math.random() * 8) + 1,
            'twitter.com': Math.floor(Math.random() * 6) + 1,
          },
        };
      }

      // Current day stats
      const todayString = today.toISOString().split('T')[0];
      const currentStats = {
        date: todayString,
        blockedAttempts: 12,
        timePausedSeconds: 900, // 15 minutes
        sitesAccessed: {
          'youtube.com': 5,
          'facebook.com': 3,
          'twitter.com': 4,
        },
      };

      // Save to storage
      await focusHistoricalStatsStorage.set(historicalStats);
      await focusStatsStorage.set(currentStats);

      setMessage('Test data seeded successfully! Reload to see changes.');
      console.log('Historical Stats:', historicalStats);
      console.log('Current Stats:', currentStats);

      // Auto reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage('Error seeding data: ' + (error as Error).message);
      console.error('Error seeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Clear all storage data by removing the keys
      await chrome.storage.sync.remove(['focus-settings', 'focus-stats', 'focus-historical-stats', 'focus-timers']);

      setMessage('Data cleared successfully! Reloading extension...');

      // Reload the extension to pick up new defaults
      chrome.runtime.reload();
    } catch (error) {
      setMessage('Error clearing data: ' + (error as Error).message);
      console.error('Error clearing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSentry = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!isSentryReady()) {
        setMessage('Sentry not initialized. Check CEB_SENTRY_DSN in .env');
        return;
      }

      const result = await testSentryConnection();
      setMessage(result.message);
    } catch (error) {
      setMessage('Error testing Sentry: ' + (error as Error).message);
      console.error('Error testing Sentry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-border bg-muted/50 fixed bottom-4 right-4 z-50 rounded-lg border p-4 shadow-lg">
      <div className="mb-2 text-xs font-semibold">Dev Tools</div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={seedData} disabled={loading} size="sm" variant="outline">
          {loading ? 'Loading...' : 'Seed Test Data'}
        </Button>
        <Button onClick={clearData} disabled={loading} size="sm" variant="outline">
          Clear Data
        </Button>
        <Button onClick={testSentry} disabled={loading} size="sm" variant="outline">
          Test Sentry
        </Button>
      </div>
      {message && <div className="text-muted-foreground mt-2 max-w-xs text-xs">{message}</div>}
    </div>
  );
};
