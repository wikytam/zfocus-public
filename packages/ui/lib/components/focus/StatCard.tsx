import { cn } from '../../utils';
import { Card } from '../ui/card';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'accent';
  className?: string;
  delay?: number;
}

export const StatCard = ({
  icon,
  label,
  value,
  subValue,
  variant = 'default',
  className,
  delay = 0,
}: StatCardProps) => {
  const iconVariants = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent',
  };

  return (
    <Card
      variant="glass"
      className={cn(
        'hover:shadow-glow animate-fade-in p-4 opacity-0 transition-all duration-300 hover:scale-[1.02]',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 rounded-lg p-2', iconVariants[variant])}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground mb-1 text-[11px] font-medium leading-tight">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold leading-none tracking-tight">{value}</span>
            {subValue && <span className="text-muted-foreground text-[11px]">{subValue}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};
