import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    primary: 'bg-black text-white border border-black',
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-md text-xs font-mono font-semibold
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
