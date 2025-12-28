import { test, expect } from '../fixtures/extension';
import { openPopup, openOptions } from '../helpers/extension-helpers';

test.describe('Smoke Tests - Basic Functionality', () => {
  test('extension should load successfully', async ({ extensionId }) => {
    // Verify extension ID exists
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('popup page should be accessible', async ({ context, extensionId }) => {
    const popup = await openPopup(context, extensionId);

    // Check URL is correct
    expect(popup.url()).toContain(extensionId);
    expect(popup.url()).toContain('popup/index.html');

    // Check page loaded
    await popup.waitForLoadState('domcontentloaded');
    const title = await popup.title();
    expect(title).toBeTruthy();

    await popup.close();
  });

  test('options page should be accessible', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);

    // Check URL is correct
    expect(options.url()).toContain(extensionId);
    expect(options.url()).toContain('options/index.html');

    // Check page loaded
    await options.waitForLoadState('domcontentloaded');
    const title = await options.title();
    expect(title).toBeTruthy();

    await options.close();
  });

  test('popup should have main container', async ({ context, extensionId }) => {
    const popup = await openPopup(context, extensionId);
    await popup.waitForLoadState('networkidle');
    await popup.waitForTimeout(1000);

    // Check for main container
    const container = popup.locator('body > div, #root, #app');
    await expect(container.first()).toBeVisible({ timeout: 5000 });

    await popup.close();
  });

  test('options should have main container', async ({ context, extensionId }) => {
    const options = await openOptions(context, extensionId);
    await options.waitForLoadState('networkidle');
    await options.waitForTimeout(1000);

    // Check for main container
    const container = options.locator('body > div, #root, #app');
    await expect(container.first()).toBeVisible({ timeout: 5000 });

    await options.close();
  });

  test('popup should render React components', async ({ context, extensionId }) => {
    const popup = await openPopup(context, extensionId);
    await popup.waitForLoadState('networkidle');
    await popup.waitForTimeout(1500);

    // Check if React rendered (should have some content)
    const bodyText = await popup.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);

    await popup.close();
  });

  test('extension should have background service worker', async ({ context, extensionId }) => {
    // Wait for service worker
    const [background] = context.serviceWorkers();
    expect(background).toBeTruthy();
    expect(background.url()).toContain(extensionId);
  });

  test('popup and options should use same extension ID', async ({ context, extensionId }) => {
    const popup = await openPopup(context, extensionId);
    const popupUrl = popup.url();
    await popup.close();

    const options = await openOptions(context, extensionId);
    const optionsUrl = options.url();
    await options.close();

    // Both should use same extension ID
    expect(popupUrl).toContain(extensionId);
    expect(optionsUrl).toContain(extensionId);
  });
});
