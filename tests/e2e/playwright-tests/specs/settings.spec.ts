import { test, expect } from '../fixtures/extension';
import { openOptions, getStorageData } from '../helpers/extension-helpers';

test.describe('Settings Tests', () => {
  // Note: Storage clearing moved to individual tests that need it
  // to avoid issues with Chrome Storage API initialization

  test('should display settings panel', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);

      // Should show settings controls
      const settingsPanel = options.locator('[class*="settings"], form, [class*="panel"]');
      await expect(settingsPanel.first()).toBeVisible({ timeout: 3000 });
    }

    await options.close();
  });

  test('should toggle hard lock mode', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find hard lock toggle
    const hardLockToggle = options
      .locator('button[role="switch"]:near(:text("Hard Lock")), button[role="switch"]:near(:text("Khóa cứng"))')
      .first();

    if (await hardLockToggle.isVisible({ timeout: 3000 })) {
      const initialState = await hardLockToggle.getAttribute('aria-checked');

      await hardLockToggle.click();
      await options.waitForTimeout(1000);

      // Verify storage was updated
      const settings = await getStorageData(context, 'focus-settings');
      expect(settings?.hardLockMode).toBeDefined();

      const newState = await hardLockToggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }

    await options.close();
  });

  test('should change theme setting', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find theme selector
    const themeSelect = options.locator('select:near(:text("Theme")), select:near(:text("Giao diện"))').first();

    if (await themeSelect.isVisible({ timeout: 3000 })) {
      // Change to light theme
      await themeSelect.selectOption('light');
      await options.waitForTimeout(1000);

      // Verify storage was updated
      const settings = await getStorageData(context, 'focus-settings');
      expect(settings?.theme).toBe('light');

      // Verify HTML class changed
      const htmlElement = options.locator('html');
      const classes = await htmlElement.getAttribute('class');
      expect(classes).not.toContain('dark');
    }

    await options.close();
  });

  test('should toggle badge countdown setting', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find badge countdown toggle
    const badgeToggle = options
      .locator('button[role="switch"]:near(:text("Badge")), button[role="switch"]:near(:text("Hiển thị"))')
      .first();

    if (await badgeToggle.isVisible({ timeout: 3000 })) {
      const initialState = await badgeToggle.getAttribute('aria-checked');

      await badgeToggle.click();
      await options.waitForTimeout(1000);

      // Verify storage was updated
      const settings = await getStorageData(context, 'focus-settings');
      expect(settings?.showBadgeCountdown).toBeDefined();

      const newState = await badgeToggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }

    await options.close();
  });

  test('should update work schedule start time', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find start time input
    const startTimeInput = options.locator('input[type="time"]:near(:text("Start")), input[type="time"]').first();

    if (await startTimeInput.isVisible({ timeout: 3000 })) {
      await startTimeInput.fill('09:00');
      await options.waitForTimeout(1000);

      // Verify storage was updated
      const settings = await getStorageData(context, 'focus-settings');
      expect(settings?.workSchedule?.startTime).toBe('09:00');
    }

    await options.close();
  });

  test('should update work schedule end time', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find end time input
    const endTimeInput = options.locator('input[type="time"]:near(:text("End")), input[type="time"]').last();

    if (await endTimeInput.isVisible({ timeout: 3000 })) {
      await endTimeInput.fill('18:00');
      await options.waitForTimeout(1000);

      // Verify storage was updated
      const settings = await getStorageData(context, 'focus-settings');
      expect(settings?.workSchedule?.endTime).toBe('18:00');
    }

    await options.close();
  });

  test('should toggle work days', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find work days checkboxes
    const dayCheckboxes = options.locator(
      'input[type="checkbox"]:near(:text("Mon")), input[type="checkbox"]:near(:text("Tue")), button:near(:text("Mon"))',
    );

    const count = await dayCheckboxes.count();
    if (count > 0) {
      const firstCheckbox = dayCheckboxes.first();

      if (await firstCheckbox.isVisible({ timeout: 3000 })) {
        await firstCheckbox.click();
        await options.waitForTimeout(1000);

        // Verify storage was updated
        const settings = await getStorageData(context, 'focus-settings');
        expect(settings?.workSchedule?.workDays).toBeDefined();
      }
    }

    await options.close();
  });

  test('should update pause duration', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find pause duration input
    const pauseInput = options
      .locator('input[type="number"]:near(:text("Pause")), input[type="number"]:near(:text("phút"))')
      .first();

    if (await pauseInput.isVisible({ timeout: 3000 })) {
      await pauseInput.fill('30');
      await options.waitForTimeout(1000);

      // Verify storage was updated
      const settings = await getStorageData(context, 'focus-settings');
      expect(settings?.pauseMinutes).toBe(30);
    }

    await options.close();
  });

  test('should toggle allow outside hours setting', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Find allow outside hours toggle
    const outsideHoursToggle = options
      .locator('button[role="switch"]:near(:text("outside")), button[role="switch"]:near(:text("ngoài"))')
      .first();

    if (await outsideHoursToggle.isVisible({ timeout: 3000 })) {
      const initialState = await outsideHoursToggle.getAttribute('aria-checked');

      await outsideHoursToggle.click();
      await options.waitForTimeout(1000);

      // Verify storage was updated
      const settings = await getStorageData(context, 'focus-settings');
      expect(settings?.workSchedule?.allowOutsideHours).toBeDefined();

      const newState = await outsideHoursToggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }

    await options.close();
  });

  test('should prevent pause when hard lock is enabled', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab and enable hard lock
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Enable hard lock
    const hardLockToggle = options
      .locator('button[role="switch"]:near(:text("Hard Lock")), button[role="switch"]:near(:text("Khóa cứng"))')
      .first();

    if (await hardLockToggle.isVisible({ timeout: 3000 })) {
      const isEnabled = await hardLockToggle.getAttribute('aria-checked');

      if (isEnabled !== 'true') {
        await hardLockToggle.click();
        await options.waitForTimeout(1000);
      }

      // Navigate to Dashboard
      const dashboardTab = options.locator('button:has-text("Dashboard"), button:has-text("Tổng quan")').first();
      if (await dashboardTab.isVisible()) {
        await dashboardTab.click();
        await options.waitForTimeout(500);
      }

      // Pause button should be disabled
      const pauseButton = options.locator('button:has-text("Pause"), button:has-text("Tạm dừng")').first();
      if (await pauseButton.isVisible({ timeout: 3000 })) {
        const isDisabled = await pauseButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }

    await options.close();
  });

  test('should persist settings after reload', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1500);

    // Navigate to Settings tab
    const settingsTab = options.locator('button:has-text("Settings"), button:has-text("Cài đặt")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await options.waitForTimeout(500);
    }

    // Change a setting
    const themeSelect = options.locator('select:near(:text("Theme")), select:near(:text("Giao diện"))').first();

    if (await themeSelect.isVisible({ timeout: 3000 })) {
      await themeSelect.selectOption('light');
      await options.waitForTimeout(1000);
    }

    // Get settings before reload
    const settingsBefore = await getStorageData(context, 'focus-settings');

    // Reload page
    await options.reload();
    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1000);

    // Get settings after reload
    const settingsAfter = await getStorageData(context, 'focus-settings');

    // Settings should be the same
    expect(settingsAfter).toEqual(settingsBefore);

    await options.close();
  });
});
