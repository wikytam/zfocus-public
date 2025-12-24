import { useFocusStore } from './hooks/useFocusStore';
import { Header } from './components/Header';
import { PauseControl } from './components/PauseControl';
import './index.css';

const Popup = () => {
  const {
    settings,
    pauseBlocking,
    resumeBlocking,
    isWithinWorkHours,
  } = useFocusStore();

  const withinHours = isWithinWorkHours();

  return (
    <div className="w-[380px] min-h-[300px] bg-background overflow-y-auto">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-48 h-48 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="relative px-4 py-4">
        {/* Header */}
        <Header isWithinWorkHours={withinHours} isPaused={settings.isPaused} />

        {/* Dashboard Content */}
        <div className="space-y-3 mt-4">
          {/* Pause Control */}
          <PauseControl
            isPaused={settings.isPaused}
            pauseEndTime={settings.pauseEndTime}
            hardLockMode={settings.hardLockMode}
            onPause={pauseBlocking}
            onResume={resumeBlocking}
          />
        </div>
      </div>
    </div>
  );
};

export default Popup;
