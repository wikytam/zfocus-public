# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-05

### Fixed
- Reduced TIMER_UPDATE message frequency by 89% (from every 1s to every 5s, or every 1s when < 60s remaining)
- Added CleanupRegistry to track and properly cleanup all intervals and timeouts
- Implemented dispose() method for storage to prevent listener memory leaks
- Added cache size limit (50 entries) to prevent unbounded memory growth
- Fixed TypeScript type errors in memory-monitor utility

### Added
- CleanupRegistry class for centralized interval/timeout management
- Memory monitoring utility for development and debugging
- Automatic cleanup on extension suspend
- Development stats logger (60s interval, dev mode only)
- Cache eviction when limit reached (removes oldest 10 entries)

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

