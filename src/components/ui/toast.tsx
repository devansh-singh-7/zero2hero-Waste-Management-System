import React, { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

export function Toast({ message, type = 'info', duration = 4000, onClose, isVisible }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onClose, 300); 
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isLeaving) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          textColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800'
        };
    }
  };

  const styles = getToastStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full 
        ${styles.bgColor} border rounded-lg shadow-lg p-4
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className={`text-sm font-medium ${styles.textColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => {
              setIsLeaving(true);
              setTimeout(onClose, 300);
            }}
            className={`inline-flex rounded-md ${styles.textColor} hover:${styles.textColor.replace('800', '900')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
          >
            <span className="sr-only">Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}