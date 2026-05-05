'use client';
import { useCounter } from '@/hooks/use-counter';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1800, className }: Props) {
  const { count, ref } = useCounter(value, duration);
  return (
    <span ref={ref as any} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
