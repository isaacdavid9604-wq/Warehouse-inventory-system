import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'negative' | 'neutral';
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'blue',
  badge,
}) => {
  const iconVariants = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  }[variant];

  const badgeVariants = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconVariants}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </h4>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badgeVariants[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};
