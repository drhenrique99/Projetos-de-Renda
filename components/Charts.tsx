import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BetRecord, BetResult } from '../types';

interface ChartsProps {
  data: BetRecord[];
}

export const Charts: React.FC<ChartsProps> = ({ data }) => {
  // Process Data for Cumulative Profit (Line/Area Chart)
  const cumulativeData = React.useMemo(() => {
    let sum = 0;
    // Sort by date ascending
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map((bet, index) => {
      sum += bet.profitUnits;
      return {
        name: index, // or bet.date if concise
        date: bet.date,
        profit: parseFloat(sum.toFixed(2))
      };
    });
  }, [data]);

  // Process Data for Win/Loss (Pie Chart)
  const pieData = React.useMemo(() => {
    const wins = data.filter(d => d.result === BetResult.WIN).length;
    const losses = data.filter(d => d.result === BetResult.LOSS).length;
    const voids = data.filter(d => d.result === BetResult.VOID).length;
    
    return [
      { name: 'Green (Win)', value: wins },
      { name: 'Red (Loss)', value: losses },
      { name: 'Void (Devolvida)', value: voids },
    ].filter(d => d.value > 0);
  }, [data]);

  const COLORS = ['#10b981', '#ef4444', '#94a3b8'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Evolution Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolução da Banca</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" hide />
              <YAxis 
                tickFormatter={(val) => `${val}u`} 
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value} unidades`, 'Lucro Acumulado']}
                labelFormatter={(label) => `Aposta #${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorProfit)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win/Loss Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição de Resultados</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
