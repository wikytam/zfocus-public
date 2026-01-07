// Script to seed test data for Z-Guard dashboard
// Run this in Chrome DevTools Console on the extension popup/options page

/* eslint-env browser */
/* global chrome */

(async function seedTestData() {
  console.log('🌱 Starting to seed test data...');

  // Generate historical stats for last 30 days
  const historicalStats = {};
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
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

  try {
    // Save to Chrome Storage
    await chrome.storage.sync.set({
      'focus-historical-stats': historicalStats,
      'focus-stats': currentStats,
    });

    console.log('✅ Test data seeded successfully!');
    console.log('📊 Historical Stats:', historicalStats);
    console.log('📈 Current Stats:', currentStats);
    console.log('🔄 Please reload the extension page to see the changes');

    return { historicalStats, currentStats };
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
})();
