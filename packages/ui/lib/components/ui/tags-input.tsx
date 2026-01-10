import { Badge } from './badge';
import { Input } from './input';
import { cn } from '../../utils';
import { X } from 'lucide-react';
import * as React from 'react';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const TagsInput = React.forwardRef<HTMLDivElement, TagsInputProps>(
  ({ value, onChange, placeholder, className, disabled }, ref) => {
    const [inputValue, setInputValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const addTag = () => {
      const trimmedValue = inputValue.trim();
      if (trimmedValue && !value.includes(trimmedValue)) {
        onChange([...value, trimmedValue]);
        setInputValue('');
      }
    };

    const removeTag = (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag();
      } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
        removeTag(value.length - 1);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const newTags = pastedText
        .split(/[\n,]/)
        .map(tag => tag.trim())
        .filter(tag => tag && !value.includes(tag));

      if (newTags.length > 0) {
        onChange([...value, ...newTags]);
        setInputValue('');
      }
    };

    const handleContainerClick = () => {
      inputRef.current?.focus();
    };

    const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        className={cn(
          'border-input ring-offset-background focus-within:ring-ring flex min-h-[40px] w-full flex-wrap gap-2 rounded-md border bg-transparent px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        onClick={handleContainerClick}
        onKeyDown={handleContainerKeyDown}>
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1 pr-1">
            <span className="max-w-[200px] truncate font-mono text-xs">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="hover:bg-secondary-foreground/20 rounded-sm transition-colors"
                aria-label={`Remove ${tag}`}>
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onPaste={handlePaste}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="placeholder:text-muted-foreground h-7 flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    );
  },
);

TagsInput.displayName = 'TagsInput';

export { TagsInput };
export type { TagsInputProps };
