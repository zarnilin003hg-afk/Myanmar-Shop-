
import React, { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-lg w-11/12 max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
