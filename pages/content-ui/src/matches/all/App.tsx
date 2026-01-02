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
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  // Load settings and check pause state
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.sync.get(['focus-settings']);
        const settings = result['focus-settings'];
        setShowCountdown(settings?.showBadgeCountdown !== false);
        setIsPaused(settings?.isPaused === true);

        // If paused, clear timer data
        if (settings?.isPaused === true) {
          console.log('[ZFocus Content-UI] Extension is paused, clearing timer');
          setTimerData(null);
        }
      } catch {
        // Extension context invalidated - ignore
        console.log('[ZFocus Content-UI] Extension context invalidated during loadSettings');
      }
    };

    loadSettings();

    // Listen for setting changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['focus-settings']) {
        const newSettings = changes['focus-settings'].newValue;
        setShowCountdown(newSettings?.showBadgeCountdown !== false);

        // Check if pause state changed
        const wasPaused = isPaused;
        const isNowPaused = newSettings?.isPaused === true;
        setIsPaused(isNowPaused);

        if (isNowPaused && !wasPaused) {
          // Just paused - clear timer
          console.log('[ZFocus Content-UI] Extension paused via storage change, clearing timer');
          setTimerData(null);
        } else if (!isNowPaused && wasPaused) {
          // Just resumed - reset dismissed state so timer can show again
          console.log('[ZFocus Content-UI] Extension resumed, resetting dismissed state');
          setDismissed(false);
        }
      }
    };

    chrome.storage.sync.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.sync.onChanged.removeListener(handleStorageChange);
  }, [isPaused]);

  useEffect(() => {
    const handleMessage = (message: { type: string; data?: TimerData }) => {
      console.log('[ZFocus Content-UI] Received message:', message.type);
      if (message.type === 'TIMER_UPDATE' && message.data) {
        setTimerData(message.data);
        // Auto-show when time is running low
        if (message.data.remainingSeconds <= 60) {
          setDismissed(false);
        }
      } else if (message.type === 'CLEAR_TIMER') {
        // Clear timer when paused or timer stopped
        console.log('[ZFocus Content-UI] Clearing timer overlay');
        setTimerData(null);
        setDismissed(false);
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

  // Calculate circle progress for SVG
  const circumference = 2 * Math.PI * 16; // radius = 16
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Truncate site name if too long
  const displayName = siteName.length > 30 ? siteName.substring(0, 30) + '...' : siteName;

  // Handle pause actions
  const handlePauseFor = async (minutes: number) => {
    try {
      const result = await chrome.storage.sync.get(['focus-settings']);
      const settings = result['focus-settings'] || {};

      const pauseUntil = Date.now() + minutes * 60 * 1000;

      await chrome.storage.sync.set({
        'focus-settings': {
          ...settings,
          isPaused: true,
          pauseUntil,
        },
      });

      setShowPauseMenu(false);
      setDismissed(true);
    } catch {
      // Extension context invalidated - page will reload
      console.log('[ZFocus Content-UI] Extension context invalidated');
    }
  };

  const togglePauseMenu = (e: React.MouseEvent) => {
    // Don't toggle if clicking close button
    if ((e.target as HTMLElement).closest('.close-button')) return;
    setShowPauseMenu(!showPauseMenu);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 2147483647,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
      <div style={{ position: 'relative' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={togglePauseMenu}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              togglePauseMenu(e as unknown as React.MouseEvent);
            }
          }}
          style={{
            background: isCritical
              ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : isWarning
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            color: 'white',
            animation: isCritical ? 'pulse 1s infinite' : undefined,
            cursor: 'pointer',
          }}>
          <style>
            {`
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
              }
            `}
          </style>

          {/* Single row layout: Logo | Title | Time | Circle | X */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
              <img
                src={chrome.runtime.getURL('icon-34.png')}
                alt="ZFocus"
                style={{
                  width: '24px',
                  height: '24px',
                }}
              />
            </div>

            {/* Title */}
            <div style={{ fontSize: '14px', fontWeight: 600, flexShrink: 0 }} title={siteName}>
              {displayName}
            </div>

            {/* Time */}
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '-0.5px',
                flexShrink: 0,
              }}>
              {timeDisplay}
            </div>

            {/* Progress Circle */}
            <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
              <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                {/* Progress circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={isCritical ? '#fca5a5' : isWarning ? '#fcd34d' : '#4ade80'}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
            </div>

            {/* Close button */}
            <button
              className="close-button"
              onClick={e => {
                e.stopPropagation();
                setDismissed(true);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
              ✕
            </button>
          </div>
        </div>

        {/* Pause Menu Popup */}
        {showPauseMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              color: 'white',
              minWidth: '180px',
            }}>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: 500 }}>Pause for:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => handlePauseFor(15)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                15 minutes
              </button>
              <button
                onClick={() => handlePauseFor(30)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                30 minutes
              </button>
              <button
                onClick={() => handlePauseFor(60)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                1 hour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
