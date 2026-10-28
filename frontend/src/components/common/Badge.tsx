import React from 'react';
import { StockStatus } from '../../types/product';
import { getStatusBadgeConfig } from '../../utils/formatters';

interface BadgeProps {
  status?: StockStatus;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children?: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  showDot = true,
  className = '',
}) => {
  if (status) {
    const config = getStatusBadgeConfig(status);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass} ${className}`}
      >
        {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />}
        {children || config.label}
      </span>
    );
  }

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant || 'neutral'];

  const dotStyles = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
  }[variant || 'neutral'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles}`} />}
      {children}
    </span>
  );
};
