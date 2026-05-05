import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-display text-lg font-medium mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4 text-pretty">{description}</p>
      )}
      {action}
    </div>
  );
}
