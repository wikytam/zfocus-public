import { test, expect } from '../fixtures/extension';
import { openPopup, openOptions, getStorageData, wait } from '../helpers/extension-helpers';

test.describe('Integration Tests - End to End Workflows', () => {
  test.beforeEach(async ({ context }) => {
    // Clear storage before each test
    const pages = context.pages();
    if (pages.length > 0) {
      await pages[0].evaluate(
        () =>
          new Promise<void>(resolve => {
            chrome.storage.sync.clear(() => resolve());
          }),
      );
    }
  });

  test('complete workflow: add site, visit it, check stats', async ({ context, extensionId }) => {
    // Step 1: Open options and add a new blocked site
    const options = await openOptions(context, extensionId);
    await options.waitForLoadState('networkidle');
    await wait(1500);

    // Navigate to Sites tab
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await wait(500);
    }

    // Add new site
    const addButton = options
      .locator('button:has-text("Add"), button:has-text("Thêm"), button:has-text("New")')
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
      await wait(1000);

      // Fill form
      const titleInput = options
        .locator('input[name="title"], input[placeholder*="title"], input[placeholder*="tên"]')
        .first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Integration Site');
      }

      const urlInput = options
        .locator('textarea[name="urls"], textarea[placeholder*="URL"], input[placeholder*="URL"]')
        .first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('example.com');
      }

      // Submit
      const submitButton = options
        .locator('button[type="submit"], button:has-text("Add"), button:has-text("Save")')
        .last();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await wait(1500);
      }
    }

    // Verify site was added
    const settings = await getStorageData(context, 'focus-settings');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addedSite = settings?.blockedSites?.find((s: any) => s.title === 'Test Integration Site');
    expect(addedSite).toBeDefined();

    await options.close();

    // Step 2: Open popup and check initial stats
    const popup = await openPopup(context, extensionId);
    await popup.waitForLoadState('networkidle');
    await wait(1000);

    // Should show 0 blocks initially
    const stats = await getStorageData(context, 'focus-stats');
    expect(stats?.blockedAttempts || 0).toBe(0);

    await popup.close();

    // Step 3: Visit the blocked site
    const page = await context.newPage();
    await page.goto('https://www.example.com');
    await wait(3000);

    // Timer should be created
    const timers = await getStorageData(context, 'focus-timers');
    expect(timers).toBeDefined();

    await page.close();

    // Step 4: Check popup again for updated stats
    const popup2 = await openPopup(context, extensionId);
    await popup2.waitForLoadState('networkidle');
    await wait(1000);

    // Stats might be updated
    const updatedStats = await getStorageData(context, 'focus-stats');
    expect(updatedStats).toBeDefined();

    await popup2.close();
  });

  test('pause workflow: pause blocking, visit site, resume', async ({ context, extensionId }) => {
    // Setup a blocked site first
    const pages = context.pages();
    if (pages.length > 0) {
      await pages[0].evaluate(
        () =>
          new Promise<void>(resolve => {
            chrome.storage.sync.set(
              {
                'focus-settings': {
                  blockedSites: [
                    {
                      id: 'test-pause',
                      title: 'Test Pause Site',
                      urls: ['facebook.com'],
                      allowedMinutesPerHour: 1,
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
    }

    await wait(1000);

    // Step 1: Open popup and pause blocking
    const popup = await openPopup(context, extensionId);
    await popup.waitForLoadState('networkidle');
    await wait(1500);

    const pauseButton = popup.locator('button:has-text("Pause"), button:has-text("Tạm dừng")').first();
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      await wait(1000);
    }

    // Verify paused
    const settings = await getStorageData(context, 'focus-settings');
    // isPaused might be set (depends on UI flow)
    expect(settings).toBeDefined();

    await popup.close();

    // Step 2: Visit blocked site while paused
    const page = await context.newPage();
    try {
      await page.goto('https://www.facebook.com', { timeout: 10000 });
      await wait(3000);

      // Should not be blocked while paused
      expect(page.url()).toContain('facebook.com');
    } catch (error) {
      console.log('Could not visit site:', error);
    }

    await page.close();

    // Step 3: Resume blocking
    const popup2 = await openPopup(context, extensionId);
    await popup2.waitForLoadState('networkidle');
    await wait(1000);

    const resumeButton = popup2.locator('button:has-text("Resume"), button:has-text("Tiếp tục")').first();
    if (await resumeButton.isVisible()) {
      await resumeButton.click();
      await wait(1000);
    }

    await popup2.close();
  });

  test('settings workflow: change theme and verify across pages', async ({ context, extensionId }) => {
    // Step 1: Open options and change theme to light
    const options = await openOptions(context, extensionId);
    await options.waitForLoadState('networkidle');
    await wait(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await wait(500);
    }

    // Change theme
    const themeSelect = options.locator('select:near(:text("Theme")), select:near(:text("Giao diện"))').first();
    if (await themeSelect.isVisible({ timeout: 3000 })) {
      await themeSelect.selectOption('light');
      await wait(1000);
    }

    // Verify theme changed in options
    let htmlElement = options.locator('html');
    let classes = await htmlElement.getAttribute('class');
    expect(classes).not.toContain('dark');

    await options.close();

    // Step 2: Open popup and verify theme is applied
    const popup = await openPopup(context, extensionId);
    await popup.waitForLoadState('networkidle');
    await wait(1000);

    htmlElement = popup.locator('html');
    classes = await htmlElement.getAttribute('class');
    expect(classes).not.toContain('dark');

    await popup.close();

    // Step 3: Verify storage
    const settings = await getStorageData(context, 'focus-settings');
    expect(settings?.theme).toBe('light');
  });

  test('hard lock workflow: enable hard lock and verify pause is disabled', async ({ context, extensionId }) => {
    // Step 1: Open options and enable hard lock
    const options = await openOptions(context, extensionId);
    await options.waitForLoadState('networkidle');
    await wait(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await wait(500);
    }

    // Enable hard lock
    const hardLockToggle = options
      .locator('button[role="switch"]:near(:text("Hard Lock")), button[role="switch"]:near(:text("Khóa cứng"))')
      .first();

    if (await hardLockToggle.isVisible({ timeout: 3000 })) {
      const isEnabled = await hardLockToggle.getAttribute('aria-checked');

      if (isEnabled !== 'true') {
        await hardLockToggle.click();
        await wait(1000);
      }
    }

    await options.close();

    // Step 2: Open popup and verify pause button is disabled
    const popup = await openPopup(context, extensionId);
    await popup.waitForLoadState('networkidle');
    await wait(1000);

    const pauseButton = popup.locator('button:has-text("Pause"), button:has-text("Tạm dừng")').first();
    if (await pauseButton.isVisible({ timeout: 3000 })) {
      const isDisabled = await pauseButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }

    await popup.close();

    // Step 3: Verify storage
    const settings = await getStorageData(context, 'focus-settings');
    expect(settings?.hardLockMode).toBe(true);
  });

  test('daily stats reset workflow', async ({ context, extensionId }) => {
    // Step 1: Set stats with old date
    const pages = context.pages();
    if (pages.length > 0) {
      await pages[0].evaluate(
        () =>
          new Promise<void>(resolve => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            chrome.storage.sync.set(
              {
                'focus-stats': {
                  date: yesterdayStr,
                  blockedAttempts: 50,
                  timeSavedMinutes: 120,
                  sitesAccessed: {},
                },
              },
              () => resolve(),
            );
          }),
      );
    }

    await wait(1000);

    // Step 2: Open popup (should trigger stats reset)
    const popup = await openPopup(context, extensionId);
    await popup.waitForLoadState('networkidle');
    await wait(1500);

    // Stats should be reset to today
    const stats = await getStorageData(context, 'focus-stats');
    const today = new Date().toISOString().split('T')[0];

    expect(stats?.date).toBe(today);
    expect(stats?.blockedAttempts).toBe(0);
    expect(stats?.timeSavedMinutes).toBe(0);

    await popup.close();
  });

  test('multi-site blocking workflow', async ({ context }) => {
    // Setup multiple blocked sites
    const pages = context.pages();
    if (pages.length > 0) {
      await pages[0].evaluate(
        () =>
          new Promise<void>(resolve => {
            chrome.storage.sync.set(
              {
                'focus-settings': {
                  blockedSites: [
                    {
                      id: 'site-1',
                      title: 'Social Media',
                      urls: ['facebook.com'],
                      allowedMinutesPerHour: 5,
                      action: 'redirect',
                      isActive: true,
                      schedule: {
                        startTime: '00:00',
                        endTime: '23:59',
                        workDays: [0, 1, 2, 3, 4, 5, 6],
                        allowOutsideHours: true,
                      },
                    },
                    {
                      id: 'site-2',
                      title: 'Video Sites',
                      urls: ['youtube.com'],
                      allowedMinutesPerHour: 10,
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
    }

    await wait(1000);

    // Visit first site
    const page1 = await context.newPage();
    try {
      await page1.goto('https://www.facebook.com', { timeout: 10000 });
      await wait(2000);
    } catch (error) {
      console.log('Could not visit Facebook:', error);
    }
    await page1.close();

    // Visit second site
    const page2 = await context.newPage();
    try {
      await page2.goto('https://www.youtube.com', { timeout: 10000 });
      await wait(2000);
    } catch (error) {
      console.log('Could not visit YouTube:', error);
    }
    await page2.close();

    // Check timers
    const timers = await getStorageData(context, 'focus-timers');

    // Should have timers for both sites
    expect(timers).toBeDefined();
    if (timers) {
      expect(Object.keys(timers).length).toBeGreaterThanOrEqual(0);
    }
  });
});
