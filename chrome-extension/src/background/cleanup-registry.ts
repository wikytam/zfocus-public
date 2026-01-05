/**
 * Cleanup Registry for tracking and managing intervals/timeouts
 * Prevents memory leaks by ensuring all timers are properly cleaned up
 */

class CleanupRegistry {
  private intervals: Set<NodeJS.Timeout> = new Set();
  private timeouts: Set<NodeJS.Timeout> = new Set();

  registerInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval);
    return interval;
  }

  registerTimeout(timeout: NodeJS.Timeout): NodeJS.Timeout {
    this.timeouts.add(timeout);
    return timeout;
  }

  unregisterInterval(interval: NodeJS.Timeout): void {
    this.intervals.delete(interval);
  }

  unregisterTimeout(timeout: NodeJS.Timeout): void {
    this.timeouts.delete(timeout);
  }

  cleanup(): void {
    console.log(`[ZFocus Cleanup] Clearing ${this.intervals.size} intervals and ${this.timeouts.size} timeouts`);
    this.intervals.forEach(interval => clearInterval(interval));
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.intervals.clear();
    this.timeouts.clear();
  }

  getStats() {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
    };
  }
}

export const cleanupRegistry = new CleanupRegistry();
