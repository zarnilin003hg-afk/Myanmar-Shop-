
import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color: 'success' | 'warning' | 'danger' | 'info';
}

const colorClasses = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export const Badge: React.FC<BadgeProps> = React.memo(({ children, color }) => {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colorClasses[color]}`}>
      {children}
    </span>
  );
});