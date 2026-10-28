import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(({ type, title, message, duration = 4500 }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 6000 });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Render Area */}
      <div 
        aria-live="polite" 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map(toast => {
          const config = {
            success: {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
              border: 'border-emerald-200 bg-emerald-50 text-emerald-950',
            },
            error: {
              icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
              border: 'border-rose-200 bg-rose-50 text-rose-950',
            },
            warning: {
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
              border: 'border-amber-200 bg-amber-50 text-amber-950',
            },
            info: {
              icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
              border: 'border-blue-200 bg-blue-50 text-blue-950',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-bottom-2 ${config.border}`}
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-5">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-slate-600 mt-0.5 break-words">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 rounded"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
