import { useEffect, useState } from 'react';
import { useI18n } from '@extension/i18n';

interface TimerData {
  siteId: string;
  siteName: string;
  usedSeconds: number;
  allowedSeconds: number;
  remainingSeconds: number;
}

interface WorkSchedule {
  startTime: string;
  endTime: string;
  workDays: number[];
  allowOutsideHours: boolean;
}

const isWithinWorkHoursCheck = (schedule: WorkSchedule): boolean => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (!schedule.workDays.includes(currentDay)) {
    return false;
  }

  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentTime >= startMinutes && currentTime <= endMinutes;
};

export default function App() {
  const { t } = useI18n();
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [hardLockMode, setHardLockMode] = useState(false);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);

  const isPauseLocked = hardLockMode && workSchedule !== null && isWithinWorkHoursCheck(workSchedule);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.sync.get(['focus-settings']);
        const settings = result['focus-settings'];
        setShowCountdown(settings?.showBadgeCountdown !== false);
        setIsPaused(settings?.isPaused === true);
        setHardLockMode(settings?.hardLockMode === true);
        if (settings?.workSchedule) {
          setWorkSchedule(settings.workSchedule);
        }

        if (settings?.isPaused === true) {
          console.log('[ZFocus Content-UI] Extension is paused, clearing timer');
          setTimerData(null);
        }
      } catch {
        console.log('[ZFocus Content-UI] Extension context invalidated during loadSettings');
      }
    };

    loadSettings();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['focus-settings']) {
        const newSettings = changes['focus-settings'].newValue;
        setShowCountdown(newSettings?.showBadgeCountdown !== false);
        setHardLockMode(newSettings?.hardLockMode === true);
        if (newSettings?.workSchedule) {
          setWorkSchedule(newSettings.workSchedule);
        }

        const wasPaused = isPaused;
        const isNowPaused = newSettings?.isPaused === true;
        setIsPaused(isNowPaused);

        if (isNowPaused && !wasPaused) {
          console.log('[ZFocus Content-UI] Extension paused via storage change, clearing timer');
          setTimerData(null);
        } else if (!isNowPaused && wasPaused) {
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
    if (isPauseLocked) return;

    try {
      const result = await chrome.storage.sync.get(['focus-settings']);
      const settings = result['focus-settings'] || {};

      if (settings.hardLockMode) {
        const schedule = settings.workSchedule;
        if (schedule && isWithinWorkHoursCheck(schedule)) {
          console.log('[ZFocus Content-UI] Hard Lock Mode active during work hours, pause blocked');
          return;
        }
      }

      const pauseEndTime = Date.now() + minutes * 60 * 1000;

      await chrome.storage.sync.set({
        'focus-settings': {
          ...settings,
          isPaused: true,
          pauseEndTime,
        },
      });

      // Notify background script to clear timers and schedule alarm
      try {
        chrome.runtime.sendMessage({ type: 'PAUSE_BLOCKING', minutes });
      } catch {
        // Background might not be ready
      }

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
            border: 'none',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            <div style={{ fontSize: '14px', fontWeight: 600, flexShrink: 0 }} title={siteName}>
              {displayName}
            </div>

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

            <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
              <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
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
            {isPauseLocked ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>{t('hardLockMode')}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{t('hardLockModeDesc')}</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: 500 }}>
                  {t('pauseFor')}:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[3, 5, 10].map(min => (
                    <button
                      key={min}
                      onClick={() => handlePauseFor(min)}
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
                      {min} {t('minutes')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
