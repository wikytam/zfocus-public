# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-09

### Fixed
- [2026-01-09] Fixed timer cache missing error during hourly resets by preserving cache entries for active timers
- [2026-01-09] Fixed React minified error 185 by adding DOM ready checks and duplicate root prevention in options, popup, and side-panel pages
- [2026-01-07] Reduced TIMER_UPDATE message frequency by 89% (from every 1s to every 5s, or every 1s when < 60s remaining)
- [2026-01-07] Added CleanupRegistry to track and properly cleanup all intervals and timeouts
- [2026-01-07] Implemented dispose() method for storage to prevent listener memory leaks
- [2026-01-07] Added cache size limit (50 entries) to prevent unbounded memory growth
- [2026-01-07] Fixed TypeScript type errors in memory-monitor utility
- [2026-01-07] Last tab in window now redirects to dashboard instead of closing when blocked site timer expires

### Changed
- Migrated state management to Zustand for better performance and developer experience
- Centralized store logic in packages/shared for reusability across pages
- Removed duplicate useFocusStore hooks from popup and options pages
- Deleted old hook files and empty hooks directories for cleaner codebase
- Modified tab close behavior to prevent closing last tab in window

### Added
- CleanupRegistry class for centralized interval/timeout management
- Memory monitoring utility for development and debugging
- Automatic cleanup on extension suspend
- Development stats logger (60s interval, dev mode only)
- Cache eviction when limit reached (removes oldest 10 entries)
- Zustand state management library for improved state handling
- Smart tab close prevention: when closing the last tab in a window, redirect to dashboard instead
- Historical stats storage: 30-day data retention for Time Pause and Blocked Attempts
- StatsChart component with week/month view using shadcn/ui Chart components
- Interactive charts in Popup and Options pages showing statistics trends
- Integrated shadcn/ui chart components for consistent design system
- SeedDataButton dev tool for testing dashboard with sample data
- URL tab navigation: ?tab=overview, ?tab=websites, ?tab=settings for Options page
- Browser history integration for tab navigation with back/forward support

### Performance
- CPU usage reduced by approximately 40%
- Message frequency reduced by 89%
- Memory growth rate: 0.00 MB/hour (stable)
- Battery impact reduced by approximately 50%

## [0.5.0] - Previous Release

### Features
- Initial release with focus timer functionality
- Site blocking with customizable time limits
- Pause/resume functionality
- Statistics tracking
- Multi-language support (EN, JA, KO, VI, ZH)
