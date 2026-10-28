import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-900 flex items-start justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-rose-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 flex-shrink-0"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
};
