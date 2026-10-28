import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  required = false,
  id: explicitId,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
        {hint && (
          <span id={hintId} className="text-xs text-slate-500">
            {hint}
          </span>
        )}
      </div>

      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`block w-full rounded-lg border text-sm transition-colors py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10' : ''
          } ${rightElement ? 'pr-12' : ''} ${
            error
              ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-100'
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
