import React, { useEffect, useState } from 'react';
import { X, Sparkles, Trophy, AlertTriangle, MinusCircle } from 'lucide-react';
import { BetRecord, BetResult } from '../types';
import { analyzeBet } from '../services/geminiService';

interface AnalysisModalProps {
  bet: BetRecord | null;
  onClose: () => void;
  contextKPIs: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ bet, onClose, contextKPIs }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bet) {
      setLoading(true);
      setAnalysis('');
      analyzeBet(bet, contextKPIs)
        .then((text) => {
          setAnalysis(text);
        })
        .finally(() => setLoading(false));
    }
  }, [bet, contextKPIs]);

  if (!bet) return null;

  const resultColor = 
    bet.result === BetResult.WIN ? 'text-green-600 bg-green-50' :
    bet.result === BetResult.LOSS ? 'text-red-600 bg-red-50' :
    'text-gray-600 bg-gray-50';

  const resultIcon =
    bet.result === BetResult.WIN ? <Trophy className="w-5 h-5 mr-2" /> :
    bet.result === BetResult.LOSS ? <AlertTriangle className="w-5 h-5 mr-2" /> :
    <MinusCircle className="w-5 h-5 mr-2" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-slate-800">Detalhes da Entrada</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Main Stats Row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Competição</p>
              <p className="font-semibold text-slate-700">{bet.competition}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold flex items-center ${resultColor}`}>
              {resultIcon}
              {bet.result} ({bet.profitUnits > 0 ? '+' : ''}{bet.profitUnits}u)
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-gray-500">Evento</span>
                <span className="font-medium text-slate-700">{bet.home} vs {bet.away}</span>
              </div>
              <div>
                <span className="block text-gray-500">Mercado</span>
                <span className="font-medium text-slate-700">{bet.market}</span>
              </div>
              <div>
                <span className="block text-gray-500">Odds</span>
                <span className="font-medium text-slate-700">{bet.odds.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-gray-500">Investimento</span>
                <span className="font-medium text-slate-700">{bet.units}u</span>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">AI Analysis</span>
            </div>
            
            <div className="min-h-[100px] text-slate-600 text-sm leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2 py-4">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-indigo-400">Interpretando dados com Google Gemini...</span>
                </div>
              ) : (
                <p>{analysis}</p>
              )}
            </div>
          </div>

        </div>
        
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-right">
           <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">
             Fechar
           </button>
        </div>

      </div>
    </div>
  );
};
