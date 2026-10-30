import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none"
    >
      {toasts.map((toast) => {
        let Icon = Info;
        let iconClass = 'text-stone-500';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconClass = 'text-[#237A57] dark:text-[#78C9A4]';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconClass = 'text-[#94621B] dark:text-[#F0C477]';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconClass = 'text-[#B93838] dark:text-[#F29A9A]';
        } else {
          iconClass = 'text-[#3569A8] dark:text-[#80B9F5]';
        }

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#FFFFFF] dark:bg-[#1B293D] text-[#172B4D] dark:text-[#F0F5FC] shadow-md transition-all"
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconClass}`} aria-hidden="true" />
            <p className="text-xs font-medium leading-relaxed flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-[#4D607B] hover:text-[#172B4D] dark:text-[#B1C2D8] dark:hover:text-[#F0F5FC] transition-colors p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
