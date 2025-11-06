import { ReactNode } from 'react';
import { useCardTilt } from '@/hooks/use-card-tilt';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
}

export function TiltCard({ children, className = '', maxTilt = 5, scale = 1.01 }: TiltCardProps) {
  const { ref, style } = useCardTilt({ maxTilt, scale, speed: 200 });

  return (
    <div
      ref={ref}
      className={`card-tilt ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
