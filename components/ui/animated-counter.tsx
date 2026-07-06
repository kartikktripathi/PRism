import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 3000 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const startTime = performance.now();

    function updateNumber(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutExpo (starts fast, decays smoothly to final value)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    }

    requestAnimationFrame(updateNumber);
  }, [value, duration]);

  return <span>{count}</span>;
}
