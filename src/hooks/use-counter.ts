'use client';
import { useState, useEffect, useRef } from 'react';

export function useCounter(end: number, duration = 1800, start = 0) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const startTime = performance.now();
      function update(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        setCount(Math.round(start + (end - start) * eased));
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, start]);

  return { count, ref };
}
