"use client";

import { useState, useEffect } from "react";
import { Terminal } from "lucide-react";
import { ConsoleOverlay } from "@/features/console/ConsoleOverlay";

export function ConsoleLauncher() {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999]">
        {/* Particle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 h-1 w-1 rounded-full bg-purple-400"
              style={{
                animation: `particle-float ${2 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
                transform: `rotate(${i * 60}deg) translateX(30px)`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Open command console"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 p-[2px] transition-all duration-300 hover:scale-110 ease-bounce focus-ring float-subtle pulse-glow"
          style={{
            transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--panel)]/90 backdrop-blur-xl transition-all duration-300 group-hover:bg-[var(--panel)]/70">
            <Terminal
              className={`transition-all duration-300 ease-bounce ${
                isHovered ? 'scale-125 text-purple-300 rotate-12' : 'text-purple-400'
              }`}
              size={24}
            />
          </div>

          {/* Orbiting ring */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-spin" style={{ animationDuration: '8s' }} />

          {/* Pulsing outer glow */}
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 opacity-50 blur-xl transition-all duration-300 group-hover:opacity-75 pulse-glow" />

          {/* Secondary glow layer */}
          <div className="absolute inset-0 -z-20 rounded-full bg-purple-500 opacity-20 blur-2xl animate-pulse-slow" />

          {/* Hover shimmer effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
        </button>
      </div>

      {open && <ConsoleOverlay onClose={() => setOpen(false)} />}

      <style jsx>{`
        @keyframes particle-float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-15px) scale(1.2);
            opacity: 0.2;
          }
        }
      `}</style>
    </>
  );
}
