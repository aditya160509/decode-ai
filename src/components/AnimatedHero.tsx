import { ReactNode } from 'react';

interface AnimatedHeroProps {
  children: ReactNode;
  className?: string;
  showSpotlights?: boolean;
}

export function AnimatedHero({ children, className = '', showSpotlights = true }: AnimatedHeroProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-bg-animated opacity-40 pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-background pointer-events-none" />

      {/* Dot pattern */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      {/* Spotlight effects */}
      {showSpotlights && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl animate-pulse-slow"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full opacity-20 blur-3xl animate-pulse-slow"
            style={{
              background: "radial-gradient(circle, rgba(45,212,191,0.5) 0%, transparent 70%)",
              animationDelay: '1s'
            }}
          />
          <div
            className="absolute bottom-1/4 left-1/4 h-[350px] w-[350px] rounded-full opacity-20 blur-3xl animate-pulse-slow"
            style={{
              background: "radial-gradient(circle, rgba(96,165,250,0.5) 0%, transparent 70%)",
              animationDelay: '2s'
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
