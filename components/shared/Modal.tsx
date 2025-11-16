
import React, { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({ onClose, children, size = 'md' }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl p-6 md:p-8 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};