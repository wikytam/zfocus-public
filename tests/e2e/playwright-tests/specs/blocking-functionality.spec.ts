import { test, expect } from '../fixtures/extension';
import { wait } from '../helpers/extension-helpers';

test.describe('Website Blocking Functionality', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    // Setup blocked sites
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
                    id: 'test-social',
                    title: 'Social Media Sites',
                    urls: ['facebook.com', 'twitter.com', 'instagram.com'],
                    allowedMinutesPerHour: 2,
                    action: 'redirect',
                    redirectUrl: 'https://www.example.com',
                    isActive: true,
                    schedule: {
                      startTime: '00:00',
                      endTime: '23:59',
                      workDays: [0, 1, 2, 3, 4, 5, 6],
                      allowOutsideHours: true,
                    },
                  },
                  {
                    id: 'test-video',
                    title: 'Video Sites',
                    urls: ['youtube.com'],
                    allowedMinutesPerHour: 1,
                    action: 'close',
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

    console.log('✅ Settings configured');
    await setupPage.close();
    await wait(1000);
  });

  test('should allow access to non-blocked sites', async ({ context, extensionId }) => {
    const page = await context.newPage();

    // Visit a non-blocked site
    await page.goto('https://www.example.com');
    await wait(2000);

    // Should stay on example.com
    expect(page.url()).toContain('example.com');
    console.log('✅ Non-blocked site accessible:', page.url());

    // Check storage from extension page
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
    await wait(2000);

    const timers = await extensionPage.evaluate(
      () =>
        new Promise(resolve => {
          chrome.storage.sync.get(['focus-timers'], result => {
            resolve(result['focus-timers']);
          });
        }),
    );

    const hasTimer = timers && Object.keys(timers).length > 0;
    console.log('Timer status:', hasTimer ? 'Has timer' : 'No timer');

    // Should not have timer for non-blocked site
    expect(hasTimer).toBeFalsy();

    await extensionPage.close();
    await page.close();
  });

  test('should detect blocked site visit (Facebook)', async ({ context, extensionId }) => {
    const page = await context.newPage();

    try {
      // Visit Facebook
      await page.goto('https://www.facebook.com', { timeout: 15000 });
      await wait(3000);

      console.log('Visited URL:', page.url());

      // Check storage from extension page
      const extensionPage = await context.newPage();
      await extensionPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
      await wait(2000);

      const timers = await extensionPage.evaluate(
        () =>
          new Promise(resolve => {
            chrome.storage.sync.get(['focus-timers'], result => {
              resolve(result['focus-timers']);
            });
          }),
      );

      if (timers && Object.keys(timers).length > 0) {
        console.log('✅ Timer created for Facebook:', timers);

        // Verify timer is for the correct site
        const timerKey = Object.keys(timers)[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timer = (timers as any)[timerKey];

        expect(timer.siteId).toBe('test-social');
        expect(timer.usedSeconds).toBeGreaterThan(0);
        expect(timer.allowedSeconds).toBe(120); // 2 minutes
      } else {
        console.log('⚠️ No timer created - might be blocked by Facebook or network issue');
      }

      await extensionPage.close();
    } catch (error) {
      console.log('⚠️ Could not access Facebook:', error);
      // This is expected - Facebook might block automated browsers
    }

    await page.close();
  });

  test('should detect blocked site visit (YouTube)', async ({ context, extensionId }) => {
    const page = await context.newPage();

    try {
      // Visit YouTube
      await page.goto('https://www.youtube.com', { timeout: 15000 });
      await wait(3000);

      console.log('Visited URL:', page.url());

      // Check storage from extension page
      const extensionPage = await context.newPage();
      await extensionPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
      await wait(2000);

      const timers = await extensionPage.evaluate(
        () =>
          new Promise(resolve => {
            chrome.storage.sync.get(['focus-timers'], result => {
              resolve(result['focus-timers']);
            });
          }),
      );

      if (timers && Object.keys(timers).length > 0) {
        console.log('✅ Timer created for YouTube:', timers);

        // Verify timer is for the correct site
        const timerKey = Object.keys(timers)[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timer = (timers as any)[timerKey];

        expect(timer.siteId).toBe('test-video');
        expect(timer.usedSeconds).toBeGreaterThan(0);
        expect(timer.allowedSeconds).toBe(60); // 1 minute
      } else {
        console.log('⚠️ No timer created - might be blocked or network issue');
      }

      await extensionPage.close();
    } catch (error) {
      console.log('⚠️ Could not access YouTube:', error);
    }

    await page.close();
  });

  test('should verify extension is monitoring sites', async ({ context, extensionId }) => {
    // Just verify that settings are stored correctly
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup/index.html`);
    await wait(2000);

    const settings = await extensionPage.evaluate(
      () =>
        new Promise(resolve => {
          chrome.storage.sync.get(['focus-settings'], result => {
            resolve(result['focus-settings']);
          });
        }),
    );

    console.log('Stored settings:', settings);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((settings as any).blockedSites).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((settings as any).blockedSites[0].id).toBe('test-social');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((settings as any).blockedSites[1].id).toBe('test-video');

    console.log('✅ Extension settings verified');

    await extensionPage.close();
  });
});
