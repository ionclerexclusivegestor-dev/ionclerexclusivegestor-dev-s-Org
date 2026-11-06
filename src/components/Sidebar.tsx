import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  MessageSquareText,
  Building2,
  Calendar,
  X,
  Menu,
  Database,
} from 'lucide-react';
import { getSaudacaoIoncler, getDataHojeExtenso } from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { ModalSqlSupabase } from './ModalSqlSupabase';

export type TabType = 'dashboard' | 'pagamentos' | 'mensagens' | 'imoveis';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  qtdImoveisAtivos: number;
  qtdAtrasados: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  qtdImoveisAtivos,
  qtdAtrasados,
}) => {
  const { isDark } = useTheme();
  const [saudacao, setSaudacao] = useState<string>(getSaudacaoIoncler());
  const [dataExtenso, setDataExtenso] = useState<string>(getDataHojeExtenso());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalSupabaseOpen, setModalSupabaseOpen] = useState(false);
  const isConfigured = isSupabaseConfigured();

  // Atualização automática do horário e saudação a cada 30 segundos
  useEffect(() => {
    const updateTimeAndGreeting = () => {
      setSaudacao(getSaudacaoIoncler());
      setDataExtenso(getDataHojeExtenso());
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColorDark?: string;
    badgeColorLight?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'pagamentos',
      label: 'Pagamentos',
      icon: CreditCard,
      badge: qtdAtrasados > 0 ? `${qtdAtrasados} pendente${qtdAtrasados > 1 ? 's' : ''}` : null,
      badgeColorDark: 'bg-red-950/90 text-red-400 border border-red-800/80',
      badgeColorLight: 'bg-red-50 text-red-700 border border-red-200',
    },
    {
      id: 'mensagens',
      label: 'Mensagens',
      icon: MessageSquareText,
      badge: 'WhatsApp',
      badgeColorDark: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
      badgeColorLight: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      id: 'imoveis',
      label: 'Imóveis',
      icon: Building2,
      badge: qtdImoveisAtivos > 0 ? qtdImoveisAtivos : null,
      badgeColorDark: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60',
      badgeColorLight: 'bg-slate-100 text-slate-700 border border-slate-300',
    },
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* BARRA SUPERIOR MOBILE APENAS */}
      <header
        className={`lg:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-black/95 border-zinc-850 text-zinc-100'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src="/assets/aistudio/Ioncler_marca_dagua_08b96136.png"
            alt="Ioncler Exclusive"
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`text-xs font-bold flex items-center gap-1.5 justify-end ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {saudacao}
            </div>
            <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{dataExtenso}</div>
          </div>
        </div>
      </header>

      {/* OVERLAY DO MENU MOBILE */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR LATERAL ESQUERDA (DESKTOP FIXA + MOBILE DRAWER) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 border-r flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isDark
            ? 'bg-[#09090c] border-zinc-850/90 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        } ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* TOPO: LOGOMARCA CENTRALIZADA */}
          <div className={`p-5 border-b relative flex flex-col items-center justify-center text-center ${isDark ? 'border-zinc-800/70' : 'border-slate-200'}`}>
            {/* Botão fechar apenas no mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`lg:hidden absolute right-3 top-3 p-1.5 rounded-lg border cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800'
                  : 'text-slate-500 hover:text-slate-900 bg-slate-100 border-slate-200'
              }`}
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center justify-center w-full px-2 py-1">
              <img
                src="/assets/aistudio/Ioncler_marca_dagua_08b96136.png"
                alt="Ioncler Exclusive Gestor de Imóveis"
                className="h-14 sm:h-16 w-auto max-w-[210px] object-contain mx-auto drop-shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = document.getElementById('sidebar-logo-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div id="sidebar-logo-fallback" style={{ display: 'none' }} className="flex flex-col items-center gap-1.5 text-center mt-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-black text-white text-lg border border-red-500 shadow-sm">
                  IE
                </div>
                <div>
                  <div className={`text-xs font-black tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>IONCLER EXCLUSIVE</div>
                  <div className="text-[9px] text-red-500 font-bold tracking-widest">CRECI-PA 13.175</div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD DE SAUDAÇÃO E DATA NA LATERAL ESQUERDA */}
          <div
            className={`p-4 mx-4 my-4 rounded-2xl border relative overflow-hidden shadow-sm ${
              isDark
                ? 'bg-zinc-950/80 border-zinc-850/90'
                : 'bg-slate-50/90 border-slate-200/90'
            }`}
          >
            {/* Brilho vermelho */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 via-rose-600 to-red-700" />

            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
              </span>
              <span className={`text-xs font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {saudacao}
              </span>
            </div>

            <div className={`flex items-center gap-1.5 text-[11px] capitalize mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{dataExtenso}</span>
            </div>

            <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${isDark ? 'border-zinc-900/90' : 'border-slate-200'}`}>
              <span className={isDark ? 'text-zinc-500 font-medium' : 'text-slate-500 font-medium'}>
                Gestão Imobiliária
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'text-red-400 bg-red-950/60 border-red-900/60'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                CRECI-PA 13.175
              </span>
            </div>
          </div>

          {/* LISTA DE MENUS */}
          <div className="px-3 space-y-1.5 flex-1">
            <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Navegação
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer text-left group ${
                    isActive
                      ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-950/40 border border-red-500'
                      : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/80 border border-transparent'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? 'text-white'
                          : isDark
                          ? 'text-zinc-500 group-hover:text-red-500'
                          : 'text-slate-400 group-hover:text-red-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-black/30 text-white border border-white/20'
                          : isDark
                          ? item.badgeColorDark
                          : item.badgeColorLight
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* BOTÃO SUPABASE / BANCO DE DADOS */}
          <div className="p-3 mx-3 mb-1">
            <button
              onClick={() => setModalSupabaseOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs"
              title="Ver status do Supabase e copiar código SQL"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Banco Supabase</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isConfigured ? 'Conectado' : 'Configurar'}
              </span>
            </button>
          </div>

          {/* RODAPÉ DA SIDEBAR */}
          <div
            className={`p-4 border-t text-xs transition-colors ${
              isDark
                ? 'border-zinc-850/80 bg-black/40 text-zinc-500'
                : 'border-slate-100 bg-slate-50/50 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-bold text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Ioncler Exclusive
                </div>
                <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Controle de Aluguéis
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500" title="Sistema online" />
            </div>
          </div>
        </div>
      </aside>

      {/* MODAL DE CONFIGURAÇÃO E SQL DO SUPABASE */}
      <ModalSqlSupabase
        isOpen={modalSupabaseOpen}
        onClose={() => setModalSupabaseOpen(false)}
      />
    </>
  );
};
