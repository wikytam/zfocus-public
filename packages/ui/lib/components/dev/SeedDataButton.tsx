import { Button } from '../ui/button';
import { focusHistoricalStatsStorage, focusStatsStorage } from '@extension/storage';
import { useState } from 'react';

export const SeedDataButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      await focusHistoricalStatsStorage.set({});
      await focusStatsStorage.set({
        date: new Date().toISOString().split('T')[0],
        blockedAttempts: 0,
        timePausedSeconds: 0,
        sitesAccessed: {},
      });

      setMessage('Data cleared successfully! Reload to see changes.');

      // Auto reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage('Error clearing data: ' + (error as Error).message);
      console.error('Error clearing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Always show for now (can be controlled via build flag later)
  // In production, this component won't be included in the bundle

  return (
    <div className="border-border bg-muted/50 fixed bottom-4 right-4 z-50 rounded-lg border p-4 shadow-lg">
      <div className="mb-2 text-xs font-semibold">Dev Tools</div>
      <div className="flex gap-2">
        <Button onClick={seedData} disabled={loading} size="sm" variant="outline">
          {loading ? 'Loading...' : 'Seed Test Data'}
        </Button>
        <Button onClick={clearData} disabled={loading} size="sm" variant="outline">
          Clear Data
        </Button>
      </div>
      {message && <div className="text-muted-foreground mt-2 text-xs">{message}</div>}
    </div>
  );
};
