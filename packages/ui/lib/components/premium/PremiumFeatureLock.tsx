import { ActivationCodeDialog } from './ActivationCodeDialog';
import { cn } from '../../utils';
import { Button } from '../ui/button';
import { useI18n } from '@extension/i18n';
import { Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface PremiumFeatureLockProps {
  isPremium: boolean;
  onActivate: (code: string) => Promise<boolean>;
  children: React.ReactNode;
  className?: string;
}

export const PremiumFeatureLock = ({ isPremium, onActivate, children, className }: PremiumFeatureLockProps) => {
  const { t } = useI18n();
  const [showActivationDialog, setShowActivationDialog] = useState(false);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Blurred/disabled content */}
      <div className="pointer-events-none select-none opacity-50 blur-[1px]">{children}</div>

      {/* Lock overlay */}
      <div className="bg-background/60 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-[2px]">
        <div className="text-center">
          <div className="bg-primary/10 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full">
            <Lock className="text-primary h-5 w-5" />
          </div>
          <p className="text-foreground mb-1 text-sm font-medium">{t('premiumFeature')}</p>
          <Button variant="outline" size="sm" onClick={() => setShowActivationDialog(true)} className="mt-2 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {t('unlockPremium')}
          </Button>
        </div>
      </div>

      {/* Activation Dialog */}
      <ActivationCodeDialog
        open={showActivationDialog}
        onOpenChange={setShowActivationDialog}
        onActivate={onActivate}
      />
    </div>
  );
};
