import { LayoutDashboard, Settings, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

type TabType = 'dashboard' | 'sites' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'dashboard' as const, label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'sites' as const, label: 'Website', icon: Globe },
  { id: 'settings' as const, label: 'Cài đặt', icon: Settings },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="flex items-center gap-1 p-1.5 rounded-xl bg-secondary/50 backdrop-blur-sm">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'gradient-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
          )}
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
