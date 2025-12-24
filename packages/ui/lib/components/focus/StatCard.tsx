import { ReactNode } from 'react';
import { Card } from '../ui/card';
import { cn } from '../../utils';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'accent';
  className?: string;
  delay?: number;
}

export function StatCard({ icon, label, value, subValue, variant = 'default', className, delay = 0 }: StatCardProps) {
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
        'p-4 hover:shadow-glow hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-in',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', iconVariants[variant])}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium leading-tight mb-1">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight leading-none">{value}</span>
            {subValue && <span className="text-[11px] text-muted-foreground">{subValue}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
