import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
  footer,
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            {title && (
              typeof title === 'string' ? (
                <h3 className="text-base font-semibold text-slate-900 leading-6">{title}</h3>
              ) : (
                title
              )
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
