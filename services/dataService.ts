import { BetRecord, BetResult, KPIMetrics } from '../types';

// Helper to determine result from various string formats found in sheets
const parseResult = (resultStr: string, profit: number): BetResult => {
  const normalized = resultStr.toLowerCase().trim();
  if (normalized.includes('win') || normalized.includes('green') || normalized.includes('✅') || profit > 0) return BetResult.WIN;
  if (normalized.includes('loss') || normalized.includes('red') || normalized.includes('❌') || profit < 0) return BetResult.LOSS;
  if (normalized.includes('void') || normalized.includes('push') || normalized.includes('⚪') || profit === 0) return BetResult.VOID;
  return BetResult.PENDING;
};

// Generate realistic mock data if no sheet is connected
export const generateMockData = (): BetRecord[] => {
  const records: BetRecord[] = [];
  const tipsters = ['Analista Pedro', 'Machine Learning Bot', 'Estrategia Corners'];
  const competitions = ['Premier League', 'Brasileirão Série A', 'La Liga', 'NBA', 'Champions League'];
  const markets = ['Over 2.5 Goals', 'Home Win', 'Asian Handicap -0.5', 'BTTS Yes', 'Corner Over 9.5'];
  
  const baseDate = new Date('2023-01-01');
  
  for (let i = 0; i < 150; i++) {
    const isWin = Math.random() > 0.45; // 55% win rate roughly
    const isVoid = Math.random() > 0.9;
    
    let result = isWin ? BetResult.WIN : BetResult.LOSS;
    if (isVoid) result = BetResult.VOID;

    const odds = parseFloat((1.5 + Math.random() * 2.0).toFixed(2));
    const units = 1; // Flat stake for simplicity in mock
    
    let profitUnits = 0;
    if (result === BetResult.WIN) profitUnits = (odds * units) - units;
    if (result === BetResult.LOSS) profitUnits = -units;
    if (result === BetResult.VOID) profitUnits = 0;

    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);

    records.push({
      id: `bet-${i}`,
      date: date.toISOString().split('T')[0],
      competition: competitions[Math.floor(Math.random() * competitions.length)],
      tipster: tipsters[Math.floor(Math.random() * tipsters.length)],
      home: 'Team A',
      away: 'Team B',
      market: markets[Math.floor(Math.random() * markets.length)],
      units: units,
      odds: odds,
      result: result,
      profitUnits: parseFloat(profitUnits.toFixed(2)),
      profitPercent: parseFloat((profitUnits * 100).toFixed(2)) // ROI per bet
    });
  }
  return records;
};

// Robust CSV Parser that handles quoted strings (common in Sheets export)
const splitCSVLine = (str: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"') {
      // Handle escaped quotes if needed, but mostly toggle state
      if (i + 1 < str.length && str[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const parseCSVData = (csvText: string): BetRecord[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Assuming first row is header, skip it
  const records: BetRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    
    // Ensure we have enough columns (flexible check)
    if (values.length < 5) continue;

    // Clean up values (remove surrounding quotes if simple parser left them)
    const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

    // Mapping based on standard structure (flexible index)
    // 0:Date, 1:Competition, 2:Tipster, 3:Home, 4:Away, 5:Market, 6:Units, 7:Odds, 8:Result, 9:Profit, 10:Profit%
    
    const profitStr = clean(values[9] || '0').replace(',', '.');
    const profit = parseFloat(profitStr) || 0;
    
    const unitsStr = clean(values[6] || '0').replace(',', '.');
    const oddsStr = clean(values[7] || '0').replace(',', '.');
    const profitPercentStr = clean(values[10] || '0').replace(',', '.').replace('%', '');

    records.push({
      id: `row-${i}`,
      date: clean(values[0]),
      competition: clean(values[1]),
      tipster: clean(values[2]),
      home: clean(values[3]),
      away: clean(values[4]),
      market: clean(values[5]),
      units: parseFloat(unitsStr) || 0,
      odds: parseFloat(oddsStr) || 0,
      result: parseResult(clean(values[8]), profit),
      profitUnits: profit,
      profitPercent: parseFloat(profitPercentStr) || 0
    });
  }

  return records;
};

export const fetchSheetData = async (url: string): Promise<BetRecord[]> => {
  try {
    // 1. Extract Spreadsheet ID
    const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!matches || !matches[1]) {
      throw new Error("ID da planilha não encontrado. Certifique-se de usar um link válido do Google Sheets.");
    }
    const spreadsheetId = matches[1];
    
    // 2. Construct CSV Export URL
    let csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    
    // Preserve GID if present (to target specific tab)
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      csvUrl += `&gid=${gidMatch[1]}`;
    }

    // 3. Fetch Data
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
       throw new Error(`Não foi possível acessar a planilha (Erro ${response.status}). Verifique se a planilha está marcada como "Pública" ou "Qualquer pessoa com o link" em Compartilhar.`);
    }

    const text = await response.text();
    return parseCSVData(text);
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const calculateKPIs = (data: BetRecord[]): KPIMetrics => {
  const totalBets = data.length;
  if (totalBets === 0) {
    return { totalProfit: 0, totalBets: 0, winRate: 0, avgOdds: 0, roi: 0, currentBankrollGrowth: 0 };
  }

  const totalProfit = data.reduce((acc, curr) => acc + curr.profitUnits, 0);
  const totalStaked = data.reduce((acc, curr) => acc + curr.units, 0);
  
  const winningBets = data.filter(r => r.result === BetResult.WIN).length;
  
  // Winrate: Wins / (Wins + Losses) usually, excluding voids
  const validBetsForWinRate = data.filter(r => r.result === BetResult.WIN || r.result === BetResult.LOSS).length;
  const winRate = validBetsForWinRate > 0 ? (winningBets / validBetsForWinRate) * 100 : 0;

  const avgOdds = data.reduce((acc, curr) => acc + curr.odds, 0) / totalBets;
  
  // ROI: Total Profit / Total Staked
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

  return {
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    totalBets,
    winRate: parseFloat(winRate.toFixed(2)),
    avgOdds: parseFloat(avgOdds.toFixed(2)),
    roi: parseFloat(roi.toFixed(2)),
    currentBankrollGrowth: parseFloat((totalProfit * 5).toFixed(2)) // Mocking bankroll impact assuming 1u = 1% or similar
  };
};