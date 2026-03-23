import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  isPookie?: boolean;
}

const Toast: React.FC<ToastProps> = ({ toasts, removeToast, isPookie }) => {
  return (
    <div className="fixed top-4 right-4 z-[10000] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} isPookie={isPookie} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void; isPookie?: boolean }> = ({ toast, onClose, isPookie }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const handleClose = () => { setIsLeaving(true); setTimeout(onClose, 300); };

  const styles = isPookie ? {
    info: 'from-pink-500/90 to-rose-400/90 border-pink-400/40 shadow-pink-500/20',
    success: 'from-fuchsia-500/90 to-pink-500/90 border-fuchsia-400/40 shadow-fuchsia-500/20',
    error: 'from-rose-600/90 to-red-500/90 border-rose-400/40 shadow-rose-500/20',
  }[toast.type] : {
    info: 'from-blue-500/90 to-blue-600/90 border-blue-400/20',
    success: 'from-emerald-500/90 to-emerald-600/90 border-emerald-400/20',
    error: 'from-red-500/90 to-red-600/90 border-red-400/20',
  }[toast.type];

  const icons = isPookie ? {
    info: '🎀',
    success: '💖',
    error: '💔',
  }[toast.type] : {
    info: '💬',
    success: '✅',
    error: '❌',
  }[toast.type];

  return (
    <div
      className={`
        bg-gradient-to-r ${styles} text-white rounded-xl border backdrop-blur-xl p-3.5 cursor-pointer
        transform transition-all duration-300 shadow-xl
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      onClick={handleClose}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-sm flex-shrink-0 mt-0.5">{icons}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs">{toast.title}</p>
          <p className="text-[11px] opacity-80 truncate mt-0.5">{toast.message}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="flex-shrink-0 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
