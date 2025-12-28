/* eslint-disable func-style */

import type { Page, BrowserContext } from '@playwright/test';

/**
 * Helper functions for interacting with the extension
 */

/**
 * Opens the extension popup
 */

export async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const popupUrl = `chrome-extension://${extensionId}/popup/index.html`;
  const page = await context.newPage();
  await page.goto(popupUrl);
  await page.waitForLoadState('networkidle');

  // Wait for storage API to be ready
  try {
    await waitForStorageReady(page, 5000);
  } catch {
    console.warn('[openPopup] Storage API not ready, continuing anyway');
  }

  return page;
}

/**
 * Opens the extension options page
 */

export async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const optionsUrl = `chrome-extension://${extensionId}/options/index.html`;
  const page = await context.newPage();
  await page.goto(optionsUrl);
  await page.waitForLoadState('networkidle');

  // Wait for storage API to be ready
  try {
    await waitForStorageReady(page, 5000);
  } catch {
    console.warn('[openOptions] Storage API not ready, continuing anyway');
  }

  return page;
}

/**
 * Opens the extension side panel
 */

export async function openSidePanel(context: BrowserContext, extensionId: string): Promise<Page> {
  const sidePanelUrl = `chrome-extension://${extensionId}/side-panel/index.html`;
  const page = await context.newPage();
  await page.goto(sidePanelUrl);
  await page.waitForLoadState('networkidle');

  // Wait for storage API to be ready
  try {
    await waitForStorageReady(page, 5000);
  } catch {
    console.warn('[openSidePanel] Storage API not ready, continuing anyway');
  }

  return page;
}

/**
 * Waits for an element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Gets text content of an element
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await page.waitForSelector(selector);
  const text = await element.textContent();
  return text?.trim() || '';
}

/**
 * Clicks an element and waits for navigation if needed
 */
export async function clickElement(page: Page, selector: string): Promise<void> {
  await page.click(selector);
  await page.waitForTimeout(500); // Small delay for UI updates
}

/**
 * Types text into an input field
 */
export async function typeIntoInput(page: Page, selector: string, text: string): Promise<void> {
  await page.fill(selector, text);
  await page.waitForTimeout(200);
}

/**
 * Waits for Chrome Storage API to be ready
 */

export async function waitForStorageReady(page: Page, timeout = 10000): Promise<void> {
  try {
    await page.waitForFunction(
      () =>
        typeof chrome !== 'undefined' &&
        chrome.storage &&
        chrome.storage.sync &&
        typeof chrome.storage.sync.get === 'function',
      { timeout },
    );
    // Additional wait to ensure API is fully initialized
    await page.waitForTimeout(500);
  } catch {
    console.warn('[Storage Helper] Chrome Storage API not available');
    throw new Error('Chrome Storage API not ready after timeout');
  }
}

/**
 * Clears Chrome storage (for test cleanup)
 */

export async function clearStorage(context: BrowserContext): Promise<void> {
  const pages = context.pages();
  if (pages.length > 0) {
    try {
      // Wait for storage to be ready first
      await waitForStorageReady(pages[0]);

      await pages[0].evaluate(
        () =>
          new Promise<void>(resolve => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.sync.clear(() => {
                chrome.storage.local.clear(() => {
                  resolve();
                });
              });
            } else {
              resolve();
            }
          }),
      );
    } catch {
      console.warn('[Storage Helper] Could not clear storage');
    }
  }
}

/**
 * Gets storage data from a specific page
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStorageDataFromPage(page: Page, key: string): Promise<any> {
  try {
    // Wait for storage to be ready first
    await waitForStorageReady(page);

    return await page.evaluate(
      storageKey =>
        new Promise(resolve => {
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get([storageKey], result => {
              resolve(result[storageKey]);
            });
          } else {
            resolve(null);
          }
        }),
      key,
    );
  } catch {
    console.warn(`[Storage Helper] Could not get storage data for key "${key}"`);
    return null;
  }
}

/**
 * Gets storage data (legacy - uses first page in context)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStorageData(context: BrowserContext, key: string): Promise<any> {
  const pages = context.pages();
  if (pages.length > 0) {
    return await getStorageDataFromPage(pages[0], key);
  }
  return null;
}

/**
 * Sets storage data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setStorageData(context: BrowserContext, key: string, value: any): Promise<void> {
  const pages = context.pages();
  if (pages.length > 0) {
    try {
      // Wait for storage to be ready first
      await waitForStorageReady(pages[0]);

      await pages[0].evaluate(
        ({ storageKey, storageValue }) =>
          new Promise<void>(resolve => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.sync.set({ [storageKey]: storageValue }, () => {
                resolve();
              });
            } else {
              resolve();
            }
          }),
        { storageKey: key, storageValue: value },
      );
    } catch {
      console.warn(`[Storage Helper] Could not set storage data for key "${key}"`);
    }
  }
}

/**
 * Takes a screenshot with a custom name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Waits for a specific time (use sparingly)
 */
export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the count of elements matching a selector
 */
export async function getElementCount(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}

/**
 * Selects an option from a dropdown
 */
export async function selectOption(page: Page, selector: string, value: string): Promise<void> {
  await page.selectOption(selector, value);
  await page.waitForTimeout(200);
}

/**
 * Checks a checkbox
 */
export async function checkCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = await page.locator(selector);
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
  await page.waitForTimeout(200);
}

/**
 * Unchecks a checkbox
 */
export async function uncheckCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = await page.locator(selector);
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
  await page.waitForTimeout(200);
}
