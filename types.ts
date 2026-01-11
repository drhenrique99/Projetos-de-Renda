export enum BetResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  VOID = 'VOID',
  PENDING = 'PENDING'
}

export interface BetRecord {
  id: string;
  date: string;
  competition: string;
  tipster: string;
  home: string;
  away: string;
  market: string;
  units: number;
  odds: number;
  result: BetResult;
  profitUnits: number;
  profitPercent: number;
}

export interface FilterState {
  competition: string;
  tipster: string;
  dateRange: string; // 'all', '7days', '30days'
  result: string; // 'all', 'WIN', 'LOSS'
}

export interface KPIMetrics {
  totalProfit: number;
  totalBets: number;
  winRate: number;
  avgOdds: number;
  roi: number;
  currentBankrollGrowth: number;
}
