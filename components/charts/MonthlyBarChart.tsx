
import React from 'react';
import { DeferredView } from '../DeferredView';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface MonthlyBarChartProps {
  data: any[];
  onMonthClick?: (month: string, year: number) => void;
  selectedMonth?: string | null;
  filterYear: number;
}

const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data, onMonthClick, selectedMonth, filterYear }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <DeferredView>
<ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#312e81" stopOpacity={1}/>
              <stop offset="100%" stopColor="#312e81" stopOpacity={0.6}/>
            </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={isMobile ? 9 : 12} tick={{fill: '#94a3b8', fontWeight: 600}} dy={10} />
        <YAxis axisLine={false} tickLine={false} fontSize={isMobile ? 9 : 12} allowDecimals={false} tick={{fill: '#94a3b8'}} />
        <Tooltip 
          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '16px', fontFamily: 'Inter' }}
          cursor={{ fill: '#f8fafc', radius: 8 }}
          formatter={(value: number) => [<span className="font-bold text-emerald-600">{value}</span>, 'Pegawai']}
          labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}
        />
        <Bar 
          dataKey="Pegawai" 
          radius={[8, 8, 8, 8]} 
          barSize={40}
          onClick={(data) => onMonthClick && onMonthClick(data.name, filterYear)}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry, index) => (
              <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name === selectedMonth ? 'url(#barGradientActive)' : 'url(#barGradient)'} 
                  className="transition-all duration-300 hover:opacity-80"
              />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
</DeferredView>
  );
};

export default MonthlyBarChart;
