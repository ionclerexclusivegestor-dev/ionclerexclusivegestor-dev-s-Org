/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PagamentosView, AbaPagamentos } from './components/PagamentosView';
import { MensagensView } from './components/MensagensView';
import { ImoveisView } from './components/ImoveisView';
import { ToastContainer, showToast } from './components/Toast';
import { StorageService } from './services/storageService';
import { Imovel, Pagamento } from './types';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [abaPagamentosAtiva, setAbaPagamentosAtiva] = useState<AbaPagamentos>('atrasados');
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setIsLoading(true);
      setErroCarregamento(null);
      const [listaImoveis, listaPagamentos] = await Promise.all([
        StorageService.getImoveis(),
        StorageService.getPagamentos(),
      ]);
      setImoveis(listaImoveis);
      setPagamentos(listaPagamentos);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setErroCarregamento(err.message || 'Falha ao sincronizar dados.');
      showToast('Erro ao sincronizar informações.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Contagens para os badges da sidebar
  const qtdImoveisAtivos = useMemo(() => {
    return imoveis.filter((i) => i.status === 'ativo').length;
  }, [imoveis]);

  const qtdAtrasados = useMemo(() => {
    return pagamentos.filter((p) => p.status === 'atrasado').length;
  }, [pagamentos]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-red-700 selection:text-white antialiased transition-colors duration-200 ${
        isDark ? 'bg-[#050507] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Toast Feedback notifications */}
      <ToastContainer />

      {/* Menu Lateral Esquerdo */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        qtdImoveisAtivos={qtdImoveisAtivos}
        qtdAtrasados={qtdAtrasados}
      />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen w-full">
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
          {erroCarregamento && (
            <div
              className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs ${
                isDark
                  ? 'bg-red-950/40 border-red-850 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{erroCarregamento}</span>
              </div>
              <button
                onClick={() => carregarDados()}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {isLoading && imoveis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <RefreshCw className="w-10 h-10 text-red-600 animate-spin mb-4" />
              <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Carregando sistema de aluguéis...
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Sincronizando registros do corretor Ioncler Exclusive
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  imoveis={imoveis}
                  pagamentos={pagamentos}
                  onNavigateToTab={(tab, subTab) => {
                    setActiveTab(tab);
                    if (subTab) {
                      setAbaPagamentosAtiva(subTab);
                    }
                  }}
                />
              )}

              {activeTab === 'pagamentos' && (
                <PagamentosView
                  pagamentos={pagamentos}
                  onReload={carregarDados}
                  isLoading={isLoading}
                  abaInicial={abaPagamentosAtiva}
                />
              )}

              {activeTab === 'mensagens' && (
                <MensagensView
                  imoveis={imoveis}
                  pagamentos={pagamentos}
                />
              )}

              {activeTab === 'imoveis' && (
                <ImoveisView
                  imoveis={imoveis}
                  onReload={carregarDados}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </main>

        {/* Rodapé sutil */}
        <footer
          className={`border-t py-4 mt-auto w-full transition-colors ${
            isDark
              ? 'border-zinc-900 bg-black/50 text-zinc-500'
              : 'border-slate-200 bg-white/80 text-slate-500'
          }`}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>IONCLER EXCLUSIVE</span>
              <span>•</span>
              <span className="text-red-500 font-semibold">GESTOR DE IMÓVEIS</span>
              <span>•</span>
              <span>CRECI-PA 13.175</span>
            </div>
            <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Controle de Aluguéis e Comissões
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
