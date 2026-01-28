import { useState, useCallback } from 'react';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmOptions extends AlertOptions {
  type?: 'confirm' | 'warning' | 'error';
}

export function useAlert() {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    confirmText: string;
    cancelText: string;
    showCancel: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      showCancel: false,
      onConfirm: undefined,
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title: options.title,
        message: options.message,
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        showCancel: true,
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showAlert({ title, message, type: 'success' });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string) => {
    showAlert({ title, message, type: 'error' });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string) => {
    showAlert({ title, message, type: 'warning' });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string) => {
    showAlert({ title, message, type: 'info' });
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    alertState,
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
  };
}