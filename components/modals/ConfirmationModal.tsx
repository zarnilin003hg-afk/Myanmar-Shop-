
import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>
      <div className="flex gap-3">
        <button 
          onClick={onConfirm}
          className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600"
        >
          ✓ အတည်ပြုမည်
        </button>
        <button 
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
        >
          ပယ်ဖျက်မည်
        </button>
      </div>
    </div>
  );
};