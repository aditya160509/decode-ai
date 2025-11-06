import { useRef, useState, useEffect } from 'react';

interface MagneticOptions {
  strength?: number;
  radius?: number;
}

export function useMagnetic(options: MagneticOptions = {}) {
  const { strength = 0.3, radius = 100 } = options;
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      if (distance < radius) {
        const pull = 1 - distance / radius;
        setPosition({
          x: distanceX * strength * pull,
          y: distanceY * strength * pull,
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [strength, radius]);

  return {
    ref,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  };
}
