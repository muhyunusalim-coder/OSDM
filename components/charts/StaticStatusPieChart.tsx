import React from 'react';

interface StaticStatusPieChartProps {
  data: { name: string; value: number; color: string }[];
  totalASN: number;
}

const StaticStatusPieChart: React.FC<StaticStatusPieChartProps> = ({ data, totalASN }) => {
  let cumulativePercent = 0;
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <svg viewBox="0 0 36 36" className="w-48 h-48">
        {data.map((entry, index) => {
          const percent = totalASN > 0 ? (entry.value / totalASN) * 100 : 0;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = -cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <circle
              key={index}
              cx="18"
              cy="18"
              r="15.9155"
              fill="transparent"
              stroke={entry.color}
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
      </svg>
      <div className="mt-4 w-full space-y-2">
        {data.map((entry, index) => {
          const percent = totalASN > 0 ? ((entry.value / totalASN) * 100).toFixed(1) : 0;
          return (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">{entry.value} ({percent}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaticStatusPieChart;
