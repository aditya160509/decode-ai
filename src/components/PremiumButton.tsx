import { ReactNode, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useRipple } from '@/hooks/use-ripple';

interface PremiumButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
}

export function PremiumButton({
  children,
  to,
  href,
  onClick,
  variant = 'primary',
  className = '',
  size = 'md',
  type = 'button',
}: PremiumButtonProps) {
  const { createRipple } = useRipple();

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3.5',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'text-white shadow-premium hover:shadow-premium-hover bg-gradient-to-r from-purple-600 to-blue-600',
    secondary: 'border-2 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 shadow-lg hover:shadow-xl',
    outline: 'border border-[var(--border)] hover:bg-[var(--panel)] shadow-lg hover:shadow-xl',
  };

  const baseClasses = `
    group relative ripple-container magnetic
    rounded-lg font-semibold overflow-hidden
    transition-all duration-300 hover:scale-105 ease-bounce
    ${sizeClasses[size]} ${variantClasses[variant]} ${className}
  `;

  const handleClick = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    createRipple(e);
    onClick?.(e);
  };

  if (to) {
    return (
      <Link to={to} onClick={handleClick} className={baseClasses}>
        <span className="relative z-10 group-hover:text-purple-300 transition-colors duration-200">
          {children}
        </span>
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} onClick={handleClick} className={baseClasses} target="_blank" rel="noopener noreferrer">
        <span className="relative z-10 group-hover:text-purple-300 transition-colors duration-200">
          {children}
        </span>
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </a>
    );
  }

  return (
    <button type={type} onClick={handleClick} className={baseClasses}>
      <span className="relative z-10 group-hover:text-purple-300 transition-colors duration-200">
        {children}
      </span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}
