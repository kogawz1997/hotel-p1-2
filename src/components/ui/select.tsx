import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, id, ...props }, ref) => {
    const selectId = id || React.useId();
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground/80">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
