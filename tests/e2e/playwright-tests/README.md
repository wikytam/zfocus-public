# Focus Guard - Playwright Test Suite

Comprehensive GUI testing suite for the Focus Guard Chrome Extension using Playwright.

## 📋 Test Coverage

### 1. Popup Tests (`popup.spec.ts`)
- ✅ Load popup page successfully
- ✅ Display initial stats (blocked attempts, time saved)
- ✅ Show pause control button
- ✅ Pause blocking functionality
- ✅ Display stats cards with icons
- ✅ Show work hours status indicator
- ✅ Proper popup dimensions (380x300)
- ✅ UI updates when storage changes
- ✅ Theme handling (dark/light)
- ✅ Decorative background elements

### 2. Options Page Tests (`options.spec.ts`)
- ✅ Load options page successfully
- ✅ Display navigation tabs (Dashboard, Sites, Settings)
- ✅ Show default blocked sites
- ✅ Open add site dialog
- ✅ Add new blocked site
- ✅ Toggle site active status
- ✅ Delete blocked site
- ✅ Switch between tabs
- ✅ Display site details correctly
- ✅ Show empty state when no sites
- ✅ Persist changes after page reload

### 3. Settings Tests (`settings.spec.ts`)
- ✅ Display settings panel
- ✅ Toggle hard lock mode
- ✅ Change theme setting (light/dark/system)
- ✅ Toggle badge countdown setting
- ✅ Update work schedule start time
- ✅ Update work schedule end time
- ✅ Toggle work days
- ✅ Update pause duration
- ✅ Toggle allow outside hours setting
- ✅ Prevent pause when hard lock enabled
- ✅ Persist settings after reload

### 4. Blocking Functionality Tests (`blocking.spec.ts`)
- ✅ Track time on blocked site
- ✅ Show timer overlay on blocked site
- ✅ Increment blocked attempts when time exceeded
- ✅ Not block when paused
- ✅ Not block inactive sites
- ✅ Update badge with countdown
- ✅ Reset timers at start of each hour
- ✅ Handle multiple tabs of same site
- ✅ Match URL patterns correctly (wildcards)
- ✅ Respect work schedule

### 5. Integration Tests (`integration.spec.ts`)
- ✅ Complete workflow: add site → visit → check stats
- ✅ Pause workflow: pause → visit site → resume
- ✅ Settings workflow: change theme across pages
- ✅ Hard lock workflow: enable → verify pause disabled
- ✅ Daily stats reset workflow
- ✅ Multi-site blocking workflow

## 🚀 Running Tests

### Prerequisites
1. Build the extension first:
```bash
cd /Users/tamk/temp/focus-guard
pnpm build
```

2. Navigate to test directory:
```bash
cd tests/e2e
```

### Run All Tests
```bash
pnpm test
```

### Run Specific Test Suites
```bash
# Popup tests only
pnpm test:popup

# Options page tests only
pnpm test:options

# Settings tests only
pnpm test:settings

# Blocking functionality tests only
pnpm test:blocking

# Integration tests only
pnpm test:integration
```

### Interactive Mode (Recommended for Development)
```bash
# Open Playwright UI for interactive testing
pnpm test:ui

# Run tests in headed mode (see browser)
pnpm test:headed

# Debug mode (step through tests)
pnpm test:debug
```

### View Test Report
```bash
pnpm test:report
```

## 📁 Test Structure

```
playwright-tests/
├── fixtures/
│   └── extension.ts          # Custom fixture for loading extension
├── helpers/
│   └── extension-helpers.ts  # Helper functions for common operations
├── specs/
│   ├── popup.spec.ts         # Popup page tests
│   ├── options.spec.ts       # Options page tests
│   ├── settings.spec.ts      # Settings tests
│   ├── blocking.spec.ts      # Blocking functionality tests
│   └── integration.spec.ts   # End-to-end integration tests
└── README.md                 # This file
```

## 🔧 Configuration

Test configuration is in `playwright.config.ts`:
- **Workers**: 1 (sequential testing for extension)
- **Headless**: false (extensions require headed mode)
- **Retries**: 2 in CI, 0 locally
- **Reporters**: HTML, List, JSON

## 📝 Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '../fixtures/extension';
import { openPopup, getStorageData } from '../helpers/extension-helpers';

test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ context }) => {
    // Setup: Clear storage
    const pages = context.pages();
    if (pages.length > 0) {
      await pages[0].evaluate(() => {
        return new Promise<void>(resolve => {
          chrome.storage.sync.clear(() => resolve());
        });
      });
    }
  });

  test('should do something', async ({ context, extensionId }) => {
    const popup = await openPopup(context, extensionId);
    
    // Your test logic here
    await expect(popup.locator('selector')).toBeVisible();
    
    await popup.close();
  });
});
```

## 🎯 Best Practices

1. **Always clean storage** before each test to ensure isolation
2. **Use helper functions** from `extension-helpers.ts` for common operations
3. **Add waits** after actions to allow UI updates (500-1500ms)
4. **Handle timeouts** gracefully for external sites (Facebook, YouTube, etc.)
5. **Use flexible selectors** that work with multiple languages
6. **Test both positive and negative cases**
7. **Verify storage changes** after UI interactions

## 🐛 Debugging Tips

1. **Use headed mode** to see what's happening:
   ```bash
   pnpm test:headed
   ```

2. **Use debug mode** to step through tests:
   ```bash
   pnpm test:debug
   ```

3. **Check screenshots** in `test-results/` after failures

4. **Use console.log** in tests to debug values

5. **Inspect storage** using helper functions:
   ```typescript
   const settings = await getStorageData(context, 'focus-settings');
   console.log('Settings:', settings);
   ```

## 📊 Test Results

Test results are saved in:
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML report
- `test-results.json` - JSON report for CI

## ⚠️ Known Limitations

1. **External sites**: Tests visiting Facebook, YouTube, etc. may fail due to:
   - Bot detection
   - Network issues
   - Rate limiting
   
2. **Timing**: Some tests use fixed waits which may need adjustment based on system performance

3. **Badge testing**: Cannot directly test Chrome badge API from Playwright

4. **Content script injection**: May be delayed, affecting overlay tests

## 🔄 CI/CD Integration

To run in CI:
```bash
# Build extension
pnpm build

# Run tests
cd tests/e2e
pnpm test

# Upload test results
# (configure your CI to upload test-results/ and playwright-report/)
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Chrome Extension Testing Guide](https://playwright.dev/docs/chrome-extensions)
- [Focus Guard Documentation](../../README.md)

## 🤝 Contributing

When adding new features to Focus Guard:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add new test cases for your feature
4. Update this README with new test coverage

---

**Total Test Cases**: 60+  
**Test Coverage**: Popup, Options, Settings, Blocking, Integration  
**Framework**: Playwright + TypeScript

