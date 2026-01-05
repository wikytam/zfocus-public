/**
 * Memory Monitor Utility for Chrome Extension
 * Tracks memory usage, event listeners, and potential leaks
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListenerFunction = (...args: any[]) => void;

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  // Track registered intervals and timeouts
  private trackedIntervals: Set<NodeJS.Timeout> = new Set();
  private trackedTimeouts: Set<NodeJS.Timeout> = new Set();
  private trackedListeners: Map<string, Set<ListenerFunction>> = new Map();

  constructor() {
    this.wrapTimerFunctions();
    this.wrapEventListeners();
  }

  /**
   * Wrap setInterval to track all intervals
   */
  private wrapTimerFunctions() {
    const originalSetInterval = globalThis.setInterval;
    const originalClearInterval = globalThis.clearInterval;
    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;

    // Wrap setInterval
    globalThis.setInterval = ((...args: unknown[]) => {
      const id = originalSetInterval(...(args as Parameters<typeof setInterval>));
      this.trackedIntervals.add(id);
      return id;
    }) as typeof setInterval;

    // Wrap clearInterval
    globalThis.clearInterval = ((id: NodeJS.Timeout) => {
      this.trackedIntervals.delete(id);
      originalClearInterval(id);
    }) as typeof clearInterval;

    // Wrap setTimeout
    globalThis.setTimeout = ((...args: unknown[]) => {
      const id = originalSetTimeout(...(args as Parameters<typeof setTimeout>));
      this.trackedTimeouts.add(id);
      return id;
    }) as typeof setTimeout;

    // Wrap clearTimeout
    globalThis.clearTimeout = ((id: NodeJS.Timeout) => {
      this.trackedTimeouts.delete(id);
      originalClearTimeout(id);
    }) as typeof clearTimeout;
  }

  /**
   * Wrap addEventListener to track listeners
   */
  private wrapEventListeners() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const storageAreas = ['local', 'sync', 'session'] as const;

      storageAreas.forEach(area => {
        if (chrome.storage[area]) {
          const original = chrome.storage[area].onChanged.addListener;
          const originalRemove = chrome.storage[area].onChanged.removeListener;

          chrome.storage[area].onChanged.addListener = ((
            listener: (changes: { [key: string]: chrome.storage.StorageChange }) => void,
          ) => {
            const key = `storage.${area}.onChanged`;
            if (!this.trackedListeners.has(key)) {
              this.trackedListeners.set(key, new Set());
            }
            this.trackedListeners.get(key)!.add(listener);
            original.call(chrome.storage[area].onChanged, listener);
          }) as typeof original;

          chrome.storage[area].onChanged.removeListener = ((
            listener: (changes: { [key: string]: chrome.storage.StorageChange }) => void,
          ) => {
            const key = `storage.${area}.onChanged`;
            this.trackedListeners.get(key)?.delete(listener);
            originalRemove.call(chrome.storage[area].onChanged, listener);
          }) as typeof originalRemove;
        }
      });
    }
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } })
      .memory;

    const heapSize = memory ? memory.usedJSHeapSize / (1024 * 1024) : 0; // MB
    const heapLimit = memory ? memory.jsHeapSizeLimit / (1024 * 1024) : 0; // MB
    const usedHeapPercentage = heapLimit > 0 ? (heapSize / heapLimit) * 100 : 0;

    // Count event listeners
    let eventListenerCount = 0;
    this.trackedListeners.forEach(listeners => {
      eventListenerCount += listeners.size;
    });

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapSize,
      heapLimit,
      usedHeapPercentage,
      eventListenerCount,
      intervalCount: this.trackedIntervals.size,
      timeoutCount: this.trackedTimeouts.size,
    };

    this.snapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Start monitoring at regular intervals
   */
  startMonitoring(intervalMs: number = 10000) {
    if (this.intervalId) {
      console.warn('[MemoryMonitor] Already monitoring');
      return;
    }

    this.startTime = Date.now();
    this.takeSnapshot(); // Initial snapshot

    this.intervalId = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    console.log('[MemoryMonitor] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[MemoryMonitor] Stopped monitoring');
    }
  }

  /**
   * Generate memory report
   */
  generateReport(): MemoryReport {
    if (this.snapshots.length < 2) {
      return {
        snapshots: this.snapshots,
        leakDetected: false,
        leakSeverity: 'none',
        recommendations: ['Not enough data. Continue monitoring.'],
        growthRate: 0,
      };
    }

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    const timeDiffHours = (lastSnapshot.timestamp - firstSnapshot.timestamp) / (1000 * 60 * 60);
    const memoryGrowth = lastSnapshot.heapSize - firstSnapshot.heapSize;
    const growthRate = timeDiffHours > 0 ? memoryGrowth / timeDiffHours : 0;

    // Detect leak
    let leakDetected = false;
    let leakSeverity: MemoryReport['leakSeverity'] = 'none';
    const recommendations: string[] = [];

    // Check for continuous growth
    if (growthRate > 10) {
      leakDetected = true;
      leakSeverity = 'critical';
      recommendations.push('CRITICAL: Memory growing rapidly (>10 MB/hour). Investigate immediately.');
    } else if (growthRate > 5) {
      leakDetected = true;
      leakSeverity = 'high';
      recommendations.push('HIGH: Memory growing significantly (>5 MB/hour). Review cleanup logic.');
    } else if (growthRate > 2) {
      leakDetected = true;
      leakSeverity = 'medium';
      recommendations.push('MEDIUM: Memory growing moderately (>2 MB/hour). Monitor closely.');
    } else if (growthRate > 1) {
      leakDetected = true;
      leakSeverity = 'low';
      recommendations.push('LOW: Slight memory growth detected. Consider optimization.');
    }

    // Check for excessive intervals
    if (lastSnapshot.intervalCount > 10) {
      recommendations.push(
        `WARNING: ${lastSnapshot.intervalCount} active intervals detected. Review interval cleanup.`,
      );
    }

    // Check for excessive listeners
    if (lastSnapshot.eventListenerCount > 20) {
      recommendations.push(
        `WARNING: ${lastSnapshot.eventListenerCount} event listeners registered. Check for duplicates.`,
      );
    }

    // Check heap usage
    if (lastSnapshot.usedHeapPercentage > 80) {
      recommendations.push('WARNING: Heap usage above 80%. Risk of out-of-memory errors.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage appears normal. Continue monitoring.');
    }

    return {
      snapshots: this.snapshots,
      leakDetected,
      leakSeverity,
      recommendations,
      growthRate,
    };
  }

  /**
   * Get current stats
   */
  getCurrentStats() {
    const latest = this.snapshots[this.snapshots.length - 1];
    return {
      heapSize: latest?.heapSize || 0,
      intervalCount: this.trackedIntervals.size,
      timeoutCount: this.trackedTimeouts.size,
      eventListenerCount: Array.from(this.trackedListeners.values()).reduce((sum, set) => sum + set.size, 0),
      listenersByType: Array.from(this.trackedListeners.entries()).map(([type, listeners]) => ({
        type,
        count: listeners.size,
      })),
    };
  }

  /**
   * Print report to console
   */
  printReport() {
    const report = this.generateReport();

    console.group('[MemoryMonitor] Report');
    console.log(`Leak Detected: ${report.leakDetected}`);
    console.log(`Severity: ${report.leakSeverity}`);
    console.log(`Growth Rate: ${report.growthRate.toFixed(2)} MB/hour`);
    console.log(`Snapshots: ${report.snapshots.length}`);

    if (report.snapshots.length > 0) {
      const latest = report.snapshots[report.snapshots.length - 1];
      console.log(`Current Heap: ${latest.heapSize.toFixed(2)} MB (${latest.usedHeapPercentage.toFixed(1)}%)`);
      console.log(`Active Intervals: ${latest.intervalCount}`);
      console.log(`Active Timeouts: ${latest.timeoutCount}`);
      console.log(`Event Listeners: ${latest.eventListenerCount}`);
    }

    console.group('Recommendations:');
    report.recommendations.forEach(rec => console.log(`- ${rec}`));
    console.groupEnd();

    console.groupEnd();

    return report;
  }

  /**
   * Export data as JSON
   */
  exportData() {
    const report = this.generateReport();
    const stats = this.getCurrentStats();

    return {
      report,
      stats,
      runtime: Date.now() - this.startTime,
    };
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots() {
    this.snapshots = [];
    this.startTime = Date.now();
  }
}

// Singleton instance
let monitorInstance: MemoryMonitor | null = null;

/**
 * Get or create memory monitor instance
 */
export const getMemoryMonitor = (): MemoryMonitor => {
  if (!monitorInstance) {
    monitorInstance = new MemoryMonitor();
  }
  return monitorInstance;
};

/**
 * Quick start monitoring
 */
export const startMemoryMonitoring = (intervalMs: number = 10000): MemoryMonitor => {
  const monitor = getMemoryMonitor();
  monitor.startMonitoring(intervalMs);
  return monitor;
};

/**
 * Quick stop monitoring
 */
export const stopMemoryMonitoring = (): MemoryMonitor => {
  const monitor = getMemoryMonitor();
  monitor.stopMonitoring();
  return monitor;
};

/**
 * Quick report
 */
export const getMemoryReport = (): MemoryReport => {
  const monitor = getMemoryMonitor();
  return monitor.printReport();
};
