import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Filter, RefreshCcw, FileSpreadsheet, Link as LinkIcon, AlertCircle, CheckCircle, Lock, Settings, Save, X, EyeOff, Share2, LogIn, ShieldCheck, LogOut, Youtube, Instagram, Send, Calendar, ChevronLeft, ChevronRight, Verified } from 'lucide-react';
import { BetRecord, FilterState } from '../types';
import { generateMockData, calculateKPIs, fetchSheetData } from '../services/dataService';
import { KPICards } from './KPICards';
import { Charts } from './Charts';
import { AnalysisModal } from './AnalysisModal';

const ADMIN_PASSWORD = "admin123"; // Senha alterada. Use esta senha para acessar.
const ITEMS_PER_PAGE = 20; // Quantidade de itens por página

export const Dashboard: React.FC = () => {
  // Application State
  const [data, setData] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBet, setSelectedBet] = useState<BetRecord | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sheet Connection State
  const [sheetUrl, setSheetUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  // Setup / Login Mode State
  const [isSetupMode, setIsSetupMode] = useState(true); // Se true, mostra tela de login/setup
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin / Configuration State (Inside Dashboard)
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState('');
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Filtering state
  const [filters, setFilters] = useState<FilterState>({
    competition: 'all',
    tipster: 'all',
    dateRange: '', // Usado agora como data específica (YYYY-MM-DD) ou vazio
    result: 'all'
  });

  // 1. Initial Load: Check URL Params OR LocalStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('sheet');
    const storedUrl = localStorage.getItem('betanalytics_sheet_url');

    if (sharedUrl) {
      // Prioridade: Link compartilhado
      setSheetUrl(sharedUrl);
      loadData(sharedUrl);
      setIsSetupMode(false);
    } else if (storedUrl) {
      // Fallback: LocalStorage
      setSheetUrl(storedUrl);
      loadData(storedUrl);
      setIsSetupMode(false);
    } else {
      // Nenhum dado encontrado: Mostrar tela de Setup/Login
      setIsSetupMode(true);
      setLoading(false);
    }
  }, []);

  // Helper to load data
  const loadData = async (url: string) => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const records = await fetchSheetData(url);
      if (records.length === 0) throw new Error("Planilha vazia ou formato inválido.");
      setData(records);
      setConnectionSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setConnectionError(err.message || "Erro ao carregar dados.");
      setConnectionSuccess(false);
      setLoading(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // --- HANDLERS PARA A TELA DE LOGIN INICIAL ---
  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginPassword !== ADMIN_PASSWORD) {
      setLoginError('Senha administrativa incorreta.');
      return;
    }

    if (!sheetUrl.trim()) {
      setLoginError('Por favor, insira a URL da planilha.');
      return;
    }

    setIsConnecting(true);
    try {
      const records = await fetchSheetData(sheetUrl);
      if (records.length === 0) throw new Error("Planilha inválida.");
      
      setData(records);
      setConnectionSuccess(true);
      
      // Salvar e entrar
      localStorage.setItem('betanalytics_sheet_url', sheetUrl);
      setIsSetupMode(false);
    } catch (err: any) {
      setLoginError(err.message || "Erro ao conectar. Verifique o link.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDemoMode = () => {
    setData(generateMockData());
    setConnectionSuccess(false);
    setIsSetupMode(false);
  };

  // --- HANDLERS PARA O DASHBOARD ---

  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja desconectar? A planilha salva será removida deste navegador.")) {
      localStorage.removeItem('betanalytics_sheet_url');
      setSheetUrl('');
      setData([]);
      setConnectionSuccess(false);
      setIsSetupMode(true);
      setIsConfigOpen(false);
      setLoginPassword('');
      // Limpa URL params se houver
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    await loadData(sheetUrl);
    
    if (!connectionError) {
      localStorage.setItem('betanalytics_sheet_url', sheetUrl);
      setIsConfigOpen(false); 
      setConnectionSuccess(true);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuthInput === ADMIN_PASSWORD) {
      setIsConfigOpen(true);
      setShowAdminAuth(false);
      setAdminAuthInput('');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleRefresh = () => {
    if (sheetUrl) {
      loadData(sheetUrl);
    } else {
      setLoading(true);
      setTimeout(() => {
        setData(generateMockData());
        setLoading(false);
      }, 600);
    }
  };

  const handleShare = () => {
    if (!sheetUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.set('sheet', sheetUrl);
    navigator.clipboard.writeText(url.toString());
    alert("Link copiado! Envie para qualquer pessoa visualizar este dashboard.");
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Filter by Competition
      if (filters.competition !== 'all' && item.competition !== filters.competition) return false;
      
      // Filter by Tipster
      if (filters.tipster !== 'all' && item.tipster !== filters.tipster) return false;
      
      // Filter by Result
      if (filters.result !== 'all' && item.result !== filters.result) return false;

      // Filter by Date (Exact match or simple string inclusion for robust handling)
      if (filters.dateRange && filters.dateRange !== 'all') {
        let itemDateStr = item.date ? item.date.trim() : '';
        
        // Normalizar formato ISO (ex: 2023-10-25T12:00:00 -> 2023-10-25)
        if (itemDateStr.includes('T')) {
            itemDateStr = itemDateStr.split('T')[0];
        }
        
        // Normalizar formato Brasileiro/Europeu (DD/MM/YYYY) para ISO (YYYY-MM-DD)
        if (itemDateStr.includes('/')) {
            const parts = itemDateStr.split('/');
            if (parts.length === 3) {
                // Adiciona padStart(2, '0') para garantir que 1/1/2023 vire 2023-01-01
                const day = parts[0].trim().padStart(2, '0');
                const month = parts[1].trim().padStart(2, '0');
                let year = parts[2].trim();
                
                // Tratamento básico se o ano vier abreviado (23 -> 2023)
                if (year.length === 2) year = '20' + year;

                itemDateStr = `${year}-${month}-${day}`;
            }
        }

        if (itemDateStr !== filters.dateRange) return false;
      }

      return true;
    });
  }, [data, filters]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const competitions = Array.from(new Set(data.map(d => d.competition))).filter(Boolean).sort();
  const tipsters = Array.from(new Set(data.map(d => d.tipster))).filter(Boolean).sort();
  const contextKPIs = `Total Profit: ${kpis.totalProfit}, ROI: ${kpis.roi}%, WinRate: ${kpis.winRate}%`;

  // --- RENDER: SETUP / LOGIN SCREEN ---
  if (isSetupMode) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Configuração Inicial</h1>
            <p className="text-slate-500 mt-2">
              Conecte sua planilha Google Sheets para gerar o dashboard.
            </p>
          </div>

          <form onSubmit={handleInitialSetup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL da Planilha (Pública/Link)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                  placeholder="https://docs.google.com/spreadsheets/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha de Administrador</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Senha para liberar configuração"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {loginError}
              </div>
            )}

            <button 
              type="submit"
              disabled={isConnecting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {isConnecting ? 'Verificando e Conectando...' : <><LogIn className="w-5 h-5" /> Acessar Dashboard</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <button 
              onClick={handleDemoMode}
              className="text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors"
            >
              Não tem uma planilha? Ver modo demonstração
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-16 py-2 md:py-0 gap-3 md:gap-0">
            
            {/* Left Side: Brand Card & Socials */}
            <div className="flex items-center gap-4">
               {/* Brand Card - Replaces simple logo */}
               <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-2 pr-5 shadow-sm hover:shadow-md transition-all group">
                 <div className="h-12 w-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-100 shrink-0 relative shadow-inner">
                   {/* BANNER LOGO - Salve sua imagem como 'logo.png' na pasta do projeto */}
                   <img 
                     src="logo.png" 
                     alt="Trader Lendário" 
                     className="h-full w-full object-cover transition-transform group-hover:scale-110"
                     onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                       const fallback = document.getElementById('icon-fallback');
                       if (fallback) fallback.style.display = 'flex';
                     }}
                   />
                   <div id="icon-fallback" className="hidden h-full w-full items-center justify-center text-indigo-600">
                      <LayoutDashboard className="w-6 h-6" />
                   </div>
                 </div>
                 
                 <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-tight">Dashboard</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-slate-800 leading-none">Trader Lendário</span>
                      <Verified className="w-4 h-4 text-blue-500 fill-blue-50" />
                    </div>
                 </div>
               </div>

               {/* Divider */}
               <div className="hidden md:block h-8 w-px bg-gray-200 mx-2"></div>

               {/* Social Icons */}
               <div className="flex items-center gap-3">
                 <a 
                   href="https://www.youtube.com/@TRADERLENDARIO_" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="p-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                   title="YouTube"
                 >
                   <Youtube className="w-5 h-5" />
                 </a>
                 <a 
                   href="https://www.instagram.com/_traderlendario_/" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="p-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-pink-600 hover:bg-pink-50 hover:text-pink-700 transition-all"
                   title="Instagram"
                 >
                   <Instagram className="w-5 h-5" />
                 </a>
                 <a 
                   href="https://t.me/TraderLendarioGratuito?fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnlrMRd0xsZFAzzsAiKvysf2KrWZ2G6Xx2O8eObdKiBOSaDy-NHmyoI1_B2S0_aem_rrHsUOrMO9BkpN7K0eSCZQ" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="p-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                   title="Telegram"
                 >
                   <Send className="w-5 h-5" />
                 </a>
               </div>
            </div>
            
            {/* Right Side: Actions */}
            <div className="flex items-center gap-3">
              <span className={`hidden lg:flex text-xs font-medium px-3 py-1 rounded-full border items-center gap-1 ${connectionSuccess ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <FileSpreadsheet className="w-3 h-3" />
                {connectionSuccess ? 'Live Data' : 'Demo Mode'}
              </span>
              
              {connectionSuccess && (
                <button 
                  onClick={handleShare}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                  title="Copiar Link Compartilhável"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}

              <button 
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title="Atualizar Dados"
              >
                <RefreshCcw className={`w-5 h-5 ${(loading || isConnecting) ? 'animate-spin' : ''}`} />
              </button>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Sair / Resetar Sessão"
              >
                <LogOut className="w-5 h-5" />
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              {/* Admin / Config Button */}
              <button 
                onClick={() => isConfigOpen ? setIsConfigOpen(false) : setShowAdminAuth(true)}
                className={`p-2 rounded-full transition-colors ${isConfigOpen ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700'}`}
                title="Configurações de Fonte de Dados"
              >
                {isConfigOpen ? <Settings className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* --- SECTION: CONFIGURATION AREA (Protected) --- */}
        
        {/* Password Prompt Modal */}
        {showAdminAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowAdminAuth(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" /> 
                  Área do Administrador
                </h3>
                <button onClick={() => setShowAdminAuth(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAdminAuth}>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Senha de Admin" 
                  className={`w-full p-2 border rounded-lg mb-2 outline-none focus:ring-2 ${authError ? 'border-red-300 ring-red-100' : 'border-gray-300 ring-indigo-100'}`}
                  value={adminAuthInput}
                  onChange={e => setAdminAuthInput(e.target.value)}
                />
                {authError && <p className="text-red-500 text-xs mb-3">Senha incorreta.</p>}
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm">
                  Desbloquear Configurações
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Configuration Panel (Only visible if unlocked) */}
        {isConfigOpen && (
          <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-indigo-100 ring-4 ring-indigo-50/50 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" /> Configuração da Fonte de Dados
              </h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                Fechar e Bloquear
              </button>
            </div>
            
            <form onSubmit={handleSaveConfiguration} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition-all"
                />
                <p className="mt-2 text-xs text-slate-500">
                  A planilha deve estar pública ou compartilhada como "Qualquer pessoa com o link".
                </p>
              </div>
              <button 
                type="submit" 
                disabled={isConnecting || !sheetUrl}
                className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-6 py-2.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap h-fit"
              >
                {isConnecting ? 'Verificando...' : <><Save className="w-4 h-4" /> Salvar & Carregar</>}
              </button>
            </form>
            
            {connectionError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {connectionError}
              </div>
            )}
            {connectionSuccess && (
              <div className="mt-3 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Conexão estabelecida com sucesso!
              </div>
            )}
          </div>
        )}

        {/* Locked State Banner (Subtle indicator) */}
        {!isConfigOpen && sheetUrl && !connectionError && (
          <div className="mb-6 flex justify-end">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-400 shadow-sm">
                <EyeOff className="w-3 h-3" /> Fonte de dados protegida
             </div>
          </div>
        )}

        {/* --- SECTION: MAIN DASHBOARD --- */}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mr-2 mb-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-medium mb-1 ml-1">Competição</label>
             <select 
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none hover:bg-gray-100 transition-colors cursor-pointer min-w-[160px]"
              value={filters.competition}
              onChange={(e) => setFilters({...filters, competition: e.target.value})}
            >
              <option value="all">Todas Competições</option>
              {competitions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-medium mb-1 ml-1">Tipster</label>
             <select 
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none hover:bg-gray-100 transition-colors cursor-pointer min-w-[160px]"
              value={filters.tipster}
              onChange={(e) => setFilters({...filters, tipster: e.target.value})}
            >
              <option value="all">Todos Tipsters</option>
              {tipsters.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-medium mb-1 ml-1">Resultado</label>
             <select 
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none hover:bg-gray-100 transition-colors cursor-pointer min-w-[140px]"
              value={filters.result}
              onChange={(e) => setFilters({...filters, result: e.target.value})}
            >
              <option value="all">Todos Resultados</option>
              <option value="WIN">Wins (Green)</option>
              <option value="LOSS">Losses (Red)</option>
              <option value="VOID">Devolvidas</option>
            </select>
          </div>

          {/* New Date Filter */}
          <div className="flex flex-col">
             <label className="text-xs text-gray-500 font-medium mb-1 ml-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Data Específica</label>
             <input 
              type="date"
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none hover:bg-gray-100 transition-colors cursor-pointer"
              value={filters.dateRange === 'all' ? '' : filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value || 'all'})}
            />
          </div>
          
          {filters.dateRange !== 'all' && (
             <button 
               onClick={() => setFilters({...filters, dateRange: 'all'})}
               className="text-xs text-indigo-600 hover:text-indigo-800 underline mb-3 ml-2"
             >
               Limpar Data
             </button>
          )}
        </div>

        {/* KPIs */}
        <KPICards metrics={kpis} />

        {/* Charts */}
        <Charts data={filteredData} />

        {/* Detailed Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Histórico de Entradas</h3>
            <span className="text-sm text-gray-500">{filteredData.length} registros encontrados</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3">Competição</th>
                  <th scope="col" className="px-6 py-3">Evento</th>
                  <th scope="col" className="px-6 py-3">Mercado</th>
                  <th scope="col" className="px-6 py-3 text-center">Odds</th>
                  <th scope="col" className="px-6 py-3 text-center">Stake</th>
                  <th scope="col" className="px-6 py-3 text-center">Resultado</th>
                  <th scope="col" className="px-6 py-3 text-right">Lucro</th>
                  <th scope="col" className="px-6 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((bet) => (
                  <tr 
                    key={bet.id} 
                    className="bg-white border-b hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedBet(bet)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(bet.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">{bet.competition}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{bet.home}</span>
                        <span className="text-xs text-gray-400">vs {bet.away}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded">{bet.market}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{bet.odds.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">{bet.units}u</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold
                        ${bet.result === 'WIN' ? 'bg-green-100 text-green-700' : 
                          bet.result === 'LOSS' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {bet.result}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${bet.profitUnits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {bet.profitUnits > 0 ? '+' : ''}{bet.profitUnits}u
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-indigo-600 group-hover:bg-indigo-50 p-2 rounded-lg transition-all font-medium text-xs flex items-center justify-center mx-auto">
                        Analisar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      {loading ? 'Carregando dados...' : 'Nenhum registro encontrado com os filtros atuais.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredData.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Página {currentPage} de {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Analysis Modal */}
      {selectedBet && (
        <AnalysisModal 
          bet={selectedBet} 
          onClose={() => setSelectedBet(null)} 
          contextKPIs={contextKPIs}
        />
      )}
    </div>
  );
};