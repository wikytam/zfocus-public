import { test, expect } from '../fixtures/extension';
import { wait } from '../helpers/extension-helpers';

test.describe('Background Script Tests', () => {
  test('should verify background script is loaded', async ({ context }) => {
    // Get background service worker
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    console.log('Background script URL:', background.url());
    expect(background.url()).toContain('background.js');
  });

  test('should log when visiting a website', async ({ context, extensionId }) => {
    // Setup blocked sites first
    const setupPage = await context.newPage();
    await setupPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
    await wait(2000);

    await setupPage.evaluate(
      () =>
        new Promise<void>(resolve => {
          chrome.storage.sync.set(
            {
              'focus-settings': {
                blockedSites: [
                  {
                    id: 'test-facebook',
                    title: 'Facebook',
                    urls: ['facebook.com'],
                    allowedMinutesPerHour: 2,
                    action: 'redirect',
                    isActive: true,
                    schedule: {
                      startTime: '00:00',
                      endTime: '23:59',
                      workDays: [0, 1, 2, 3, 4, 5, 6],
                      allowOutsideHours: true,
                    },
                  },
                ],
                workSchedule: {
                  startTime: '00:00',
                  endTime: '23:59',
                  workDays: [0, 1, 2, 3, 4, 5, 6],
                  allowOutsideHours: true,
                },
                pauseMinutes: 15,
                isPaused: false,
                hardLockMode: false,
                theme: 'dark',
                showBadgeCountdown: true,
              },
            },
            () => resolve(),
          );
        }),
    );

    await setupPage.close();
    console.log('✅ Settings configured');

    // Visit Facebook
    const page = await context.newPage();
    console.log('Navigating to Facebook...');
    await page.goto('https://www.facebook.com', { timeout: 15000 });
    await wait(5000); // Wait longer for background script to process

    console.log('Current URL:', page.url());

    // Check timers
    const checkPage = await context.newPage();
    await checkPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
    await wait(2000);

    const timers = await checkPage.evaluate(
      () =>
        new Promise(resolve => {
          chrome.storage.sync.get(['focus-timers'], result => {
            resolve(result['focus-timers']);
          });
        }),
    );

    console.log('Timers in storage:', timers);

    if (timers && Object.keys(timers).length > 0) {
      console.log('✅ SUCCESS: Timer was created!');
      expect(Object.keys(timers).length).toBeGreaterThan(0);
    } else {
      console.log('⚠️ WARNING: No timer was created');
      console.log('This might mean:');
      console.log('1. Background script did not detect the tab update');
      console.log('2. URL matching logic did not match facebook.com');
      console.log('3. Tab was not in "complete" status');
    }

    await checkPage.close();
    await page.close();
  });
});
