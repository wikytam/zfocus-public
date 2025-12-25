import { cn } from '../../utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import {
  disableBodyScroll,
  enableBodyScroll as enableBodyScrollFn,
  clearAllBodyScrollLocks,
} from 'body-scroll-lock-upgrade';
import * as React from 'react';

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    enableBodyScroll?: boolean;
  }
>(({ className, children, enableBodyScroll = false, ...props }, ref) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (enableBodyScroll && viewportRef.current) {
      const viewport = viewportRef.current;
      disableBodyScroll(viewport, {
        reserveScrollBarGap: true,
      });

      return () => {
        enableBodyScrollFn(viewport);
      };
    }
    return undefined;
  }, [enableBodyScroll]);

  // Cleanup on unmount
  React.useEffect(
    () => () => {
      if (enableBodyScroll) {
        clearAllBodyScrollLocks();
      }
    },
    [enableBodyScroll],
  );

  return (
    <ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
      <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className,
    )}
    {...props}>
    <ScrollAreaPrimitive.ScrollAreaThumb className="bg-border relative flex-1 rounded-full" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
