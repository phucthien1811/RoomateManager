import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let toastSeq = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const id = ++toastSeq;
    const duration = Math.max(1200, Number(options.duration) || 3000);
    const type = options.type || 'info';
    const title = options.title || (type === 'error' ? 'Lỗi' : type === 'success' ? 'Thành công' : 'Thông báo');

    setToasts((prev) => [...prev, { id, message: String(message ?? ''), duration, type, title }]);
    window.setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      showToast(message, { type: 'info', duration: 3000 });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-content">
              <strong>{toast.title}</strong>
              <span>{toast.message}</span>
            </div>
            <button type="button" className="toast-close-btn" onClick={() => removeToast(toast.id)} aria-label="Đóng">
              ×
            </button>
            <div className="toast-drain">
              <span style={{ animationDuration: `${toast.duration}ms` }} />
              <span style={{ animationDuration: `${toast.duration}ms` }} />
              <span style={{ animationDuration: `${toast.duration}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

