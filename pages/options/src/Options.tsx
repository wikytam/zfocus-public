import { useState } from 'react';
import { Ban } from 'lucide-react';
import { useFocusStore } from './hooks/useFocusStore';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { PauseControl } from './components/PauseControl';
import { BlockedSiteItem } from './components/BlockedSiteItem';
import { AddSiteDialog } from './components/AddSiteDialog';
import { SettingsPanel } from './components/SettingsPanel';
import './index.css';

type TabType = 'dashboard' | 'sites' | 'settings';

const Options = () => {
  const [activeTab, setActiveTab] = useState<TabType>('sites');
  const {
    settings,
    updateSettings,
    addBlockedSite,
    updateBlockedSite,
    removeBlockedSite,
    pauseBlocking,
    resumeBlocking,
    isWithinWorkHours,
  } = useFocusStore();

  const withinHours = isWithinWorkHours();

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-8">
        <Header isWithinWorkHours={withinHours} isPaused={settings.isPaused} />

        <div className="flex justify-center mb-8">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Pause Control */}
            <PauseControl
              isPaused={settings.isPaused}
              pauseEndTime={settings.pauseEndTime}
              hardLockMode={settings.hardLockMode}
              onPause={pauseBlocking}
              onResume={resumeBlocking}
            />
          </div>
        )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Quản lý Website</h2>
                <p className="text-sm text-muted-foreground">Thêm và cấu hình các trang web cần chặn</p>
              </div>
              <AddSiteDialog onAdd={addBlockedSite} />
            </div>

            <div className="space-y-4">
              {settings.blockedSites.map((site, index) => (
                <BlockedSiteItem
                  key={site.id}
                  site={site}
                  onUpdate={updateBlockedSite}
                  onRemove={removeBlockedSite}
                  delay={index * 50}
                />
              ))}

              {settings.blockedSites.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Ban className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Chưa có website nào được thêm</p>
                  <p className="text-sm">Nhấn "Thêm nhóm mới" để bắt đầu</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <SettingsPanel settings={settings} onUpdate={updateSettings} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Options;
