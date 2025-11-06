import { useRef, useState, useEffect } from 'react';

interface TiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
}

export function useCardTilt(options: TiltOptions = {}) {
  const {
    maxTilt = 10,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({});

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * maxTilt;
      const rotateY = ((centerX - x) / centerX) * maxTilt;

      setTiltStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
      });
    };

    const handleMouseLeave = () => {
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt, perspective, scale, speed]);

  return { ref, style: tiltStyle };
}
