# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-13

### Added
- [2026-01-10] Added TagsInput component for URL list, exceptions, and keywords with interactive tag management (add/remove tags, paste support)
- [2026-01-10] Added Badge component for visual tag display
- [2026-01-10] Added week start day preference setting (Monday/Sunday) for better chart viewing experience

### Changed
- [2026-01-13] Moved Advanced Options section to bottom of Add/Edit dialogs with smart auto-expand for Edit dialog
- [2026-01-13] Fixed hardcoded English text in time limit display, now properly uses i18n for "Allowed Time" and "minutes"
- [2026-01-13] Updated label from "Count only active tab" to "Active tab only" for better clarity and conciseness
- [2026-01-13] Updated time limit display format to inline style: "Allowed Time 3 minutes / 1 hour" for improved readability
- [2026-01-10] Changed pause time options from 15/30/60 minutes to 3/5/10 minutes for shorter break intervals
- [2026-01-10] Updated default pause selection to 5 minutes (previously 15 minutes)
- [2026-01-10] Improved URL input UX by replacing textarea with tags input in Add/Edit Site dialogs
- [2026-01-10] URLs, exceptions, and keywords now display as interactive chips/badges instead of plain text
- [2026-01-10] Chart now aligns to week start day (Monday or Sunday) based on user preference for consistent weekly view
- [2026-01-10] Removed redundant URL list description text, added descriptive example for "Active tab only" feature
- [2026-01-10] Reduced TagsInput min-height from 80px to 40px for more compact display

### Removed
- [2026-01-10] Removed example/demo content scripts to reduce extension size by 28% (from 5.0MB to 3.6MB)

### Fixed
- [2026-01-10] Fixed chart displaying discontinuous dates by generating continuous 7-day or 30-day date ranges with zero values for missing days
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
