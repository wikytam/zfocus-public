import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useI18n } from '@extension/i18n';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ActivationCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: (code: string) => Promise<boolean>;
}

export const ActivationCodeDialog = ({ open, onOpenChange, onActivate }: ActivationCodeDialogProps) => {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    const isValid = await onActivate(code);

    setLoading(false);

    if (isValid) {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setCode('');
        setSuccess(false);
      }, 1500);
    } else {
      setError(t('invalidCode'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.trim()) {
      handleActivate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            {t('enterActivationCode')}
          </DialogTitle>
          <DialogDescription>{t('premiumFeatureDesc')}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-center font-medium text-green-600 dark:text-green-400">{t('premiumActivated')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activation-code">{t('activationCode')}</Label>
              <Input
                id="activation-code"
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('activationCodePlaceholder')}
                className={error ? 'border-destructive' : ''}
                disabled={loading}
              />
              {error && (
                <div className="text-destructive flex items-center gap-1.5 text-sm">
                  <XCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                {t('cancel')}
              </Button>
              <Button onClick={handleActivate} disabled={!code.trim() || loading}>
                {loading ? '...' : t('activate')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
