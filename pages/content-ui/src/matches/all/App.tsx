import { useEffect, useState } from 'react';

interface TimerData {
  siteId: string;
  siteName: string;
  usedSeconds: number;
  allowedSeconds: number;
  remainingSeconds: number;
}

export default function App() {
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);

  // Load showBadgeCountdown setting
  useEffect(() => {
    const loadSettings = async () => {
      const result = await chrome.storage.sync.get(['focus-settings']);
      const settings = result['focus-settings'];
      setShowCountdown(settings?.showBadgeCountdown !== false);
    };

    loadSettings();

    // Listen for setting changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['focus-settings']) {
        const newSettings = changes['focus-settings'].newValue;
        setShowCountdown(newSettings?.showBadgeCountdown !== false);
      }
    };

    chrome.storage.sync.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.sync.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    const handleMessage = (message: { type: string; data: TimerData }) => {
      if (message.type === 'TIMER_UPDATE') {
        setTimerData(message.data);
        // Auto-show when time is running low
        if (message.data.remainingSeconds <= 60) {
          setDismissed(false);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Don't show if setting is disabled
  if (!showCountdown || !timerData || dismissed) return null;

  const { siteName, remainingSeconds, allowedSeconds } = timerData;
  const progress = (remainingSeconds / allowedSeconds) * 100;
  const isWarning = remainingSeconds <= 60;
  const isCritical = remainingSeconds <= 10;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 2147483647,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
      <div
        style={{
          background: isCritical
            ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
            : isWarning
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          color: 'white',
          minWidth: '280px',
          animation: isCritical ? 'pulse 1s infinite' : undefined,
        }}>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
          `}
        </style>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>FocusGuard</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{siteName}</div>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '-1px',
            }}>
            {timeDisplay}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Thời gian còn lại</div>
            <div
              style={{
                height: '6px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: isCritical ? '#fca5a5' : isWarning ? '#fcd34d' : '#4ade80',
                  borderRadius: '3px',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>
        </div>

        {isCritical && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'center',
            }}>
            ⚠️ Trang sẽ bị chặn trong {remainingSeconds} giây!
          </div>
        )}
      </div>
    </div>
  );
}
