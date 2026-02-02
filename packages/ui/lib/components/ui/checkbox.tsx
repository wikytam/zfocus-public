import { cn } from '../../utils';
import { Check } from 'lucide-react';
import * as React from 'react';

// Type definitions (exported at end of file per import-x/exports-last rule)
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'peer inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200',
          'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input bg-background hover:border-primary/50',
          className,
        )}>
        <Check
          className={cn(
            'h-3.5 w-3.5 transition-all duration-200',
            checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
          )}
          strokeWidth={3}
        />
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={() => onCheckedChange?.(!checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
      </button>
    );
  },
);
Checkbox.displayName = 'Checkbox';

// Export at end of file (import-x/exports-last rule)
export { Checkbox };
export type { CheckboxProps };
