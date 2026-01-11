import React from 'react';
import { TrendingUp, DollarSign, Target, Activity, Percent, Info } from 'lucide-react';
import { KPIMetrics } from '../types';

interface KPICardsProps {
  metrics: KPIMetrics;
}

// Componente Helper de Tooltip
const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center ml-1.5 align-middle z-10">
    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs font-normal rounded-lg shadow-xl text-center pointer-events-none transition-opacity opacity-0 group-hover:opacity-100">
      {text}
      {/* Seta do tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  const isProfitPositive = metrics.totalProfit >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      {/* Total Profit */}
      <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-l-indigo-500 relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm text-gray-500 font-medium mb-1">
              Lucro Total
              <Tooltip text="Soma total dos resultados (lucros e prejuízos) em unidades." />
            </div>
            <h3 className={`text-2xl font-bold ${isProfitPositive ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.totalProfit > 0 ? '+' : ''}{metrics.totalProfit}u
            </h3>
          </div>
          <div className="p-2 bg-indigo-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Unidades acumuladas</p>
      </div>

      {/* ROI */}
      <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-l-blue-500 relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm text-gray-500 font-medium mb-1">
              ROI
              <Tooltip text="Retorno sobre Investimento: (Lucro / Total Apostado) × 100." />
            </div>
            <h3 className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              {metrics.roi}%
            </h3>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Sobre o investido</p>
      </div>

      {/* Win Rate */}
      <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-l-emerald-500 relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm text-gray-500 font-medium mb-1">
              Taxa de Acerto
              <Tooltip text="Percentual de apostas ganhas sobre o total de resolvidas (exclui devolvidas)." />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {metrics.winRate}%
            </h3>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Apostas vencedoras</p>
      </div>

      {/* Avg Odds */}
      <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-l-amber-500 relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm text-gray-500 font-medium mb-1">
              Odd Média
              <Tooltip text="Média aritmética das cotações (odds) de todas as entradas." />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {metrics.avgOdds}
            </h3>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <Percent className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Risco médio</p>
      </div>

      {/* Volume */}
      <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-l-slate-500 relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm text-gray-500 font-medium mb-1">
              Total Entradas
              <Tooltip text="Quantidade total de registros processados da planilha." />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {metrics.totalBets}
            </h3>
          </div>
          <div className="p-2 bg-slate-100 rounded-lg">
            <Activity className="w-6 h-6 text-slate-600" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Volume de operações</p>
      </div>

    </div>
  );
};
