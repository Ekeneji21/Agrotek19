import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastContextValue {
  toast: (type: Toast['type'], message: string) => void;
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
  warning: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {}, success: () => {}, error: () => {}, info: () => {}, warning: () => {},
});

export function useToast() { return useContext(ToastContext); }

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};
const COLORS = {
  success: 'var(--primary-green)',
  error: 'var(--danger)',
  info: 'var(--info-blue)',
  warning: 'var(--warning-orange)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(Toast & { exiting?: boolean })[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220);
  }, []);

  const toast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const ctx: ToastContextValue = {
    toast,
    success: (msg) => toast('success', msg),
    error:   (msg) => toast('error', msg),
    info:    (msg) => toast('info', msg),
    warning: (msg) => toast('warning', msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-container">
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`toast toast-${t.type}${t.exiting ? ' exiting' : ''}`}
              onClick={() => dismiss(t.id)}
            >
              <Icon size={18} style={{ color: COLORS[t.type], flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <X size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
