import { test, expect } from '../fixtures/extension';
import { openOptions, waitForElement, getStorageData } from '../helpers/extension-helpers';

test.describe('Options Page Tests', () => {
  // Note: Storage clearing moved to individual tests that need it
  // to avoid issues with Chrome Storage API initialization

  test('should load options page successfully', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    // Check if main container is visible
    await waitForElement(options, 'div.bg-background');

    // Verify header exists
    const header = options.locator('header, h1, [role="banner"]');
    await expect(header.first()).toBeVisible();

    await options.close();
  });

  test('should display navigation tabs', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1000);

    // Should have navigation tabs (dashboard, sites, settings)
    const navButtons = options.locator('button[role="tab"], nav button');
    const count = await navButtons.count();

    expect(count).toBeGreaterThanOrEqual(2); // At least 2 tabs

    await options.close();
  });

  test('should show default blocked sites', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Click on Sites tab if not already active
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await options.waitForTimeout(500);
    }

    // Should show default blocked sites (3 groups by default)
    const siteItems = options.locator('[class*="site"], [class*="blocked"]');
    const count = await siteItems.count();

    expect(count).toBeGreaterThanOrEqual(1); // At least 1 default site group

    await options.close();
  });

  test('should open add site dialog when clicking add button', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Sites tab
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await options.waitForTimeout(500);
    }

    // Find and click Add button
    const addButton = options
      .locator('button:has-text("Add"), button:has-text("Thêm"), button:has-text("New")')
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
      await options.waitForTimeout(1000);

      // Dialog should be visible
      const dialog = options.locator('[role="dialog"], [class*="dialog"]');
      await expect(dialog.first()).toBeVisible({ timeout: 3000 });
    }

    await options.close();
  });

  test('should add a new blocked site', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Get initial site count
    const initialSettings = await getStorageData(context, 'focus-settings');
    const initialCount = initialSettings?.blockedSites?.length || 0;

    // Navigate to Sites tab
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await options.waitForTimeout(500);
    }

    // Click Add button
    const addButton = options
      .locator('button:has-text("Add"), button:has-text("Thêm"), button:has-text("New")')
      .first();

    if (await addButton.isVisible()) {
      await addButton.click();
      await options.waitForTimeout(1000);

      // Fill in the form
      const titleInput = options
        .locator('input[name="title"], input[placeholder*="title"], input[placeholder*="tên"]')
        .first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Site Group');
        await options.waitForTimeout(300);
      }

      const urlInput = options
        .locator('textarea[name="urls"], textarea[placeholder*="URL"], input[placeholder*="URL"]')
        .first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('example.com\ntest.com');
        await options.waitForTimeout(300);
      }

      // Submit the form
      const submitButton = options
        .locator('button[type="submit"], button:has-text("Add"), button:has-text("Save")')
        .last();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await options.waitForTimeout(1500);

        // Verify site was added
        const updatedSettings = await getStorageData(context, 'focus-settings');
        expect(updatedSettings?.blockedSites?.length).toBeGreaterThan(initialCount);
      }
    }

    await options.close();
  });

  test('should toggle site active status', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Sites tab
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await options.waitForTimeout(500);
    }

    // Find a toggle switch
    const toggleSwitch = options.locator('button[role="switch"], input[type="checkbox"]').first();

    if (await toggleSwitch.isVisible()) {
      const initialState = (await toggleSwitch.getAttribute('aria-checked')) || (await toggleSwitch.isChecked());

      await toggleSwitch.click();
      await options.waitForTimeout(1000);

      const newState = (await toggleSwitch.getAttribute('aria-checked')) || (await toggleSwitch.isChecked());

      // State should have changed
      expect(newState).not.toBe(initialState);
    }

    await options.close();
  });

  test('should delete a blocked site', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Get initial site count
    const initialSettings = await getStorageData(context, 'focus-settings');
    const initialCount = initialSettings?.blockedSites?.length || 0;

    if (initialCount === 0) {
      await options.close();
      return; // Skip if no sites
    }

    // Navigate to Sites tab
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await options.waitForTimeout(500);
    }

    // Find delete button (trash icon or delete text)
    const deleteButton = options
      .locator(
        'button:has-text("Delete"), button:has-text("Remove"), button[aria-label*="delete"], button[aria-label*="remove"]',
      )
      .first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await options.waitForTimeout(500);

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = options
        .locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")')
        .last();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      await options.waitForTimeout(1500);

      // Verify site was deleted
      const updatedSettings = await getStorageData(context, 'focus-settings');
      expect(updatedSettings?.blockedSites?.length).toBeLessThan(initialCount);
    }

    await options.close();
  });

  test('should switch between tabs', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1000);

    // Click on Dashboard tab
    const dashboardTab = options.locator('button:has-text("Dashboard"), button:has-text("Tổng quan")').first();
    if (await dashboardTab.isVisible()) {
      await dashboardTab.click();
      await options.waitForTimeout(500);

      // Should show stats
      const stats = options.locator('[class*="stat"], [class*="card"]');
      const hasStats = (await stats.count()) > 0;
      expect(hasStats).toBeTruthy();
    }

    // Click on Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);

      // Should show settings controls
      const settingsControls = options.locator('input, select, button[role="switch"]');
      const hasControls = (await settingsControls.count()) > 0;
      expect(hasControls).toBeTruthy();
    }

    await options.close();
  });

  test('should display site details correctly', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Sites tab
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await options.waitForTimeout(500);
    }

    // Check if site items show title and URLs
    const firstSite = options.locator('[class*="site"], [class*="blocked"]').first();

    if (await firstSite.isVisible()) {
      const text = await firstSite.textContent();

      // Should contain some text (title or URLs)
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    }

    await options.close();
  });

  test('should show empty state when no sites exist', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1000);

    // Clear all sites
    await options.evaluate(
      () =>
        new Promise<void>(resolve => {
          chrome.storage.sync.set(
            {
              'focus-settings': {
                blockedSites: [],
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

    await options.waitForTimeout(1000);

    // Navigate to Sites tab
    const sitesTab = options.locator('button:has-text("Sites"), button:has-text("Trang web")').first();
    if (await sitesTab.isVisible()) {
      await sitesTab.click();
      await options.waitForTimeout(500);
    }

    // Should show empty state message
    const emptyState = options.locator('text=/no.*site|chưa có|empty/i');
    await expect(emptyState.first()).toBeVisible({ timeout: 3000 });

    await options.close();
  });

  test('should persist changes after page reload', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Get current settings
    const initialSettings = await getStorageData(context, 'focus-settings');

    // Reload the page
    await options.reload();
    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1000);

    // Get settings again
    const reloadedSettings = await getStorageData(context, 'focus-settings');

    // Settings should be the same
    expect(reloadedSettings).toEqual(initialSettings);

    await options.close();
  });
});
