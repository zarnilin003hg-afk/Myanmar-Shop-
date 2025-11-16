
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  note?: string;
  color: 'purple' | 'pink' | 'blue' | 'green' | 'plain';
  titleColor?: string;
  valueColor?: string;
}

const colorStyles = {
    purple: "from-purple-500 to-indigo-500 text-white",
    pink: "from-pink-500 to-rose-500 text-white",
    blue: "from-blue-400 to-cyan-400 text-white",
    green: "from-green-400 to-emerald-400 text-white",
    plain: "bg-white dark:bg-gray-800"
};

export const StatCard: React.FC<StatCardProps> = React.memo(({ title, value, unit, note, color, titleColor = 'text-gray-600', valueColor = 'text-gray-800' }) => {
  const backgroundClass = color === 'plain' ? colorStyles.plain : `bg-gradient-to-br ${colorStyles[color]}`;
  
  return (
    <div className={`rounded-xl shadow-md p-4 md:p-6 ${backgroundClass}`}>
      <div className={`text-sm font-semibold mb-2 ${color === 'plain' ? `${titleColor} dark:text-gray-400` : 'opacity-90'}`}>{title}</div>
      <div className={`text-2xl md:text-3xl font-bold ${color === 'plain' ? `${valueColor} dark:text-gray-100` : ''}`}>
        {value}
        {unit && <span className="text-base md:text-lg font-medium ml-1">{unit}</span>}
      </div>
      {note && <div className={`text-xs mt-2 ${color === 'plain' ? 'text-gray-500 dark:text-gray-500' : 'opacity-75'}`}>{note}</div>}
    </div>
  );
});