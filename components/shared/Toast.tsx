
import React from 'react';

export interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastData> = ({ message, type }) => {
  const baseClasses = 'p-4 rounded-xl text-white font-semibold shadow-lg animate-[slideInRight_0.3s_ease-out]';
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {message}
    </div>
  );
};
