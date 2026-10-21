import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((text, type = 'ok') => {
    setToast({ text, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="toast-in fixed bottom-6 right-6 z-[60] flex max-w-sm items-center gap-3 rounded-2xl border border-stone-800 bg-stone-900 px-5 py-3.5 text-stone-100 shadow-2xl">
          {toast.type === 'err' ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          )}
          <span className="text-sm font-medium tracking-wide">{toast.text}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
