import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Building2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  User,
} from 'lucide-react';
import { Imovel, Pagamento, TipoPeriodo } from '../types';
import { TabType } from './Sidebar';
import {
  formatCurrency,
  formatDate,
  formatMonthReference,
  getBrasiliaTodayString,
  diasAteData,
} from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardViewProps {
  imoveis: Imovel[];
  pagamentos: Pagamento[];
  onNavigateToTab: (tab: TabType, subTab?: 'atrasados' | 'a_receber' | 'pagos') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  imoveis,
  pagamentos,
  onNavigateToTab,
}) => {
  const { isDark } = useTheme();

  // Configuração padrão: Mês atual
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('30dias');

  // Inicialização de datas de acordo com o mês atual de Brasília
  const hojeStr = getBrasiliaTodayString();
  const [hojeAno, hojeMes] = hojeStr.split('-').map(Number);

  // Primeiro e último dia do mês atual
  const primeiroDiaMes = `${hojeAno}-${String(hojeMes).padStart(2, '0')}-01`;
  const ultimoDiaNum = new Date(hojeAno, hojeMes, 0).getDate();
  const ultimoDiaMes = `${hojeAno}-${String(hojeMes).padStart(2, '0')}-${String(ultimoDiaNum).padStart(2, '0')}`;

  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState(primeiroDiaMes);
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState(ultimoDiaMes);

  // Determina intervalo de datas conforme o filtro selecionado
  const intervaloDatas = useMemo(() => {
    const hoje = new Date(hojeStr + 'T00:00:00');

    if (tipoPeriodo === 'hoje') {
      return { inicio: hojeStr, fim: hojeStr };
    }
    if (tipoPeriodo === '7dias') {
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 7);
      const ano = seteDiasAtras.getFullYear();
      const mes = String(seteDiasAtras.getMonth() + 1).padStart(2, '0');
      const dia = String(seteDiasAtras.getDate()).padStart(2, '0');
      return { inicio: `${ano}-${mes}-${dia}`, fim: hojeStr };
    }
    if (tipoPeriodo === '30dias') {
      return { inicio: primeiroDiaMes, fim: ultimoDiaMes };
    }
    if (tipoPeriodo === '3meses') {
      const tresMesesAtras = new Date(hojeAno, hojeMes - 3, 1);
      const ano = tresMesesAtras.getFullYear();
      const mes = String(tresMesesAtras.getMonth() + 1).padStart(2, '0');
      return { inicio: `${ano}-${mes}-01`, fim: ultimoDiaMes };
    }
    return {
      inicio: dataInicioPersonalizada || '2026-01-01',
      fim: dataFimPersonalizada || '2031-12-31',
    };
  }, [tipoPeriodo, hojeStr, primeiroDiaMes, ultimoDiaMes, dataInicioPersonalizada, dataFimPersonalizada]);

  // Parcelas dentro do período selecionado
  const parcelasPeriodo = useMemo(() => {
    return pagamentos.filter((p) => {
      return p.data_vencimento >= intervaloDatas.inicio && p.data_vencimento <= intervaloDatas.fim;
    });
  }, [pagamentos, intervaloDatas]);

  // Cards de Resumo:
  const comissaoRecebida = useMemo(() => {
    return parcelasPeriodo
      .filter((p) => p.status === 'pago')
      .reduce((sum, p) => sum + (p.valor_comissao || 0), 0);
  }, [parcelasPeriodo]);

  const comissaoPrevista = useMemo(() => {
    return parcelasPeriodo
      .filter((p) => p.status === 'pendente')
      .reduce((sum, p) => sum + (p.valor_comissao || 0), 0);
  }, [parcelasPeriodo]);

  const totalEmAtraso = useMemo(() => {
    return parcelasPeriodo
      .filter((p) => p.status === 'atrasado')
      .reduce((sum, p) => sum + (p.valor_aluguel || 0), 0);
  }, [parcelasPeriodo]);

  const totalAlugueisPeriodo = useMemo(() => {
    return parcelasPeriodo.reduce((sum, p) => sum + (p.valor_aluguel || 0), 0);
  }, [parcelasPeriodo]);

  const qtdImoveisAtivos = useMemo(() => {
    return imoveis.filter((i) => i.status === 'ativo').length;
  }, [imoveis]);

  // Histórico Mês a Mês para o Gráfico de Barras
  const dadosGrafico = useMemo(() => {
    const agrupado: Record<string, { totalAluguel: number; comissaoRecebida: number }> = {};

    pagamentos.forEach((p) => {
      if (!p.mes_referencia) return;
      if (!agrupado[p.mes_referencia]) {
        agrupado[p.mes_referencia] = { totalAluguel: 0, comissaoRecebida: 0 };
      }
      agrupado[p.mes_referencia].totalAluguel += p.valor_aluguel || 0;
      if (p.status === 'pago') {
        agrupado[p.mes_referencia].comissaoRecebida += p.valor_comissao || 0;
      }
    });

    const mesesOrdenados = Object.keys(agrupado).sort();
    const selecionados = mesesOrdenados.slice(-8);

    const maxAluguel = Math.max(...selecionados.map((m) => agrupado[m].totalAluguel), 1);
    const maxComissao = Math.max(...selecionados.map((m) => agrupado[m].comissaoRecebida), 1);

    return selecionados.map((mes) => ({
      mes,
      mesLabel: formatMonthReference(mes, true),
      totalAluguel: agrupado[mes].totalAluguel,
      comissaoRecebida: agrupado[mes].comissaoRecebida,
      alturaAluguelPct: Math.round((agrupado[mes].totalAluguel / maxAluguel) * 100),
      alturaComissaoPct: Math.round((agrupado[mes].comissaoRecebida / maxComissao) * 100),
    }));
  }, [pagamentos]);

  // Contratos que vencem nos próximos 60 dias
  const contratosVencendo = useMemo(() => {
    return imoveis
      .filter((imo) => imo.status === 'ativo' && imo.data_fim)
      .map((imo) => {
        const dias = diasAteData(imo.data_fim);
        return {
          ...imo,
          diasRestantes: dias,
        };
      })
      .filter((imo) => imo.diasRestantes >= 0 && imo.diasRestantes <= 60)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [imoveis]);

  return (
    <div className="w-full space-y-6">
      {/* SELETOR DE PERÍODO NO TOPO */}
      <div
        className={`w-full border rounded-2xl p-5 sm:p-6 space-y-4 transition-colors ${
          isDark
            ? 'bg-[#121216] border-zinc-850 shadow-xl'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Seletor de Período
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Exibindo dados de <strong>{formatDate(intervaloDatas.inicio)}</strong> até{' '}
              <strong>{formatDate(intervaloDatas.fim)}</strong>
            </p>
          </div>

          {/* Botões de Seleção de Período */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 dias' },
              { id: '30dias', label: 'Mês Atual' },
              { id: '3meses', label: 'Últimos 3 meses' },
              { id: 'personalizado', label: 'Personalizado' },
            ].map((op) => {
              const ativo = tipoPeriodo === op.id;
              return (
                <button
                  key={op.id}
                  onClick={() => setTipoPeriodo(op.id as TipoPeriodo)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    ativo
                      ? 'bg-red-600 text-white shadow-md shadow-red-950/40 border border-red-500'
                      : isDark
                      ? 'bg-zinc-950/80 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {op.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campos de Data Personalizada (2026 até 2031) */}
        {tipoPeriodo === 'personalizado' && (
          <div className={`pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in duration-200 ${isDark ? 'border-zinc-900' : 'border-slate-100'}`}>
            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              <span className="font-semibold">Data Inicial:</span>
              <input
                type="date"
                min="2026-01-01"
                max="2031-12-31"
                value={dataInicioPersonalizada}
                onChange={(e) => setDataInicioPersonalizada(e.target.value)}
                className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-600 ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              <span className="font-semibold">Data Final:</span>
              <input
                type="date"
                min="2026-01-01"
                max="2031-12-31"
                value={dataFimPersonalizada}
                onChange={(e) => setDataFimPersonalizada(e.target.value)}
                className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-red-600 ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <span className={`text-[11px] italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Calendário com navegação livre de 2026 até 2031.
            </span>
          </div>
        )}
      </div>

      {/* 5 CARDS DE RESUMO DO PERÍODO SELECIONADO (ESTENDIDOS PARA COBRIR TODA A LARGURA) */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {/* Card 1: Comissão Recebida */}
        <div
          className={`relative border rounded-2xl p-5 sm:p-6 transition-all duration-200 group flex flex-col justify-between ${
            isDark
              ? 'bg-[#121216] border-zinc-850 hover:border-emerald-700/60 shadow-xl'
              : 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500 rounded-t-2xl opacity-80" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Comissão Recebida
              </span>
              <div
                className={`p-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/60'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {formatCurrency(comissaoRecebida)}
            </div>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Parcelas pagas no período
          </p>
        </div>

        {/* Card 2: Comissão Prevista */}
        <div
          className={`relative border rounded-2xl p-5 sm:p-6 transition-all duration-200 group flex flex-col justify-between ${
            isDark
              ? 'bg-[#121216] border-zinc-850 hover:border-amber-700/60 shadow-xl'
              : 'bg-white border-slate-200 hover:border-amber-500 shadow-sm'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 rounded-t-2xl opacity-80" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Comissão Prevista
              </span>
              <div
                className={`p-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-amber-950/60 text-amber-400 border-amber-900/60'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
              {formatCurrency(comissaoPrevista)}
            </div>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Parcelas pendentes a receber
          </p>
        </div>

        {/* Card 3: Total em Atraso (CLICÁVEL PARA ABRIR ABA ATRASADOS EM PAGAMENTOS) */}
        <div
          onClick={() => onNavigateToTab('pagamentos', 'atrasados')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onNavigateToTab('pagamentos', 'atrasados');
            }
          }}
          className={`relative border rounded-2xl p-5 sm:p-6 transition-all duration-200 group flex flex-col justify-between cursor-pointer select-none ${
            isDark
              ? 'bg-[#121216] border-zinc-850 hover:border-red-600 hover:shadow-red-950/30 hover:scale-[1.01] shadow-xl'
              : 'bg-white border-slate-200 hover:border-red-500 hover:shadow-red-100 hover:scale-[1.01] shadow-sm'
          }`}
          title="Clique para ir direto à aba Atrasados em Pagamentos"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-600 rounded-t-2xl opacity-90 group-hover:h-[3px] transition-all" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400 group-hover:text-red-400' : 'text-slate-500 group-hover:text-red-600'} transition-colors`}>
                Total em Atraso
              </span>
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-1 ${
                  isDark
                    ? 'bg-red-950/80 text-red-500 border-red-800/70 group-hover:bg-red-900 group-hover:border-red-700'
                    : 'bg-red-50 text-red-600 border-red-200 group-hover:bg-red-100 group-hover:border-red-300'
                } transition-colors`}
              >
                <AlertTriangle className="w-4 h-4" />
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-500 tracking-tight">
              {formatCurrency(totalEmAtraso)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Aluguéis vencidos não pagos
            </p>
            <span className="text-[11px] font-semibold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              Ver atrasados →
            </span>
          </div>
        </div>

        {/* Card 4: Valor Total de Aluguéis */}
        <div
          className={`relative border rounded-2xl p-5 sm:p-6 transition-all duration-200 group flex flex-col justify-between ${
            isDark
              ? 'bg-[#121216] border-zinc-850 hover:border-zinc-700 shadow-xl'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-70 ${isDark ? 'bg-zinc-600' : 'bg-slate-400'}`} />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Total Aluguéis
              </span>
              <div
                className={`p-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <DollarSign className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatCurrency(totalAlugueisPeriodo)}
            </div>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Volume bruto do período
          </p>
        </div>

        {/* Card 5: Quantidade de Imóveis Ativos */}
        <div
          className={`relative border rounded-2xl p-5 sm:p-6 transition-all duration-200 group flex flex-col justify-between ${
            isDark
              ? 'bg-[#121216] border-zinc-850 hover:border-red-800/80 shadow-xl'
              : 'bg-white border-slate-200 hover:border-red-300 shadow-sm'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-700 rounded-t-2xl opacity-70" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Imóveis Ativos
              </span>
              <div
                className={`p-2.5 rounded-xl border ${
                  isDark
                    ? 'bg-red-950/50 text-red-400 border-red-900/50'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {qtdImoveisAtivos}
            </div>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Contratos ativos sob gestão
          </p>
        </div>
      </div>

      {/* SEÇÃO INFERIOR: GRÁFICO DE BARRAS HISTÓRICO + CONTRATOS VENCENDO */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO DE BARRAS MÊS A MÊS */}
        <div
          className={`lg:col-span-7 border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors ${
            isDark
              ? 'bg-[#121216] border-zinc-850 shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingUp className="w-4 h-4 text-red-500" />
                Histórico Mês a Mês
              </h3>
              {/* Legenda */}
              <div className="flex items-center gap-4 text-xs">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span className={`w-3 h-3 rounded inline-block ${isDark ? 'bg-zinc-600' : 'bg-slate-400'}`} />
                  Aluguéis (Total)
                </span>
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span className="w-3 h-3 rounded bg-red-600 inline-block shadow-[0_0_8px_rgba(220,38,38,0.7)]" />
                  Comissão Recebida
                </span>
              </div>
            </div>
            <p className={`text-xs mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Comparativo de volume total de aluguéis e comissão efetivamente recebida por mês
            </p>
          </div>

          {/* Gráfico de Barras */}
          {dadosGrafico.length === 0 ? (
            <div className={`text-center py-12 text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Sem dados suficientes para exibir o gráfico mensal.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className={`h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b pb-2 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                {dadosGrafico.map((item) => (
                  <div key={item.mes} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip com valores detalhados no hover */}
                    <div
                      className={`opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 border px-2.5 py-1.5 rounded-lg text-[10px] shadow-xl pointer-events-none z-10 whitespace-nowrap ${
                        isDark ? 'bg-black border-zinc-700 text-white' : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    >
                      <div className="font-bold text-red-400">{item.mesLabel}</div>
                      <div>Aluguel: {formatCurrency(item.totalAluguel)}</div>
                      <div>Comissão: {formatCurrency(item.comissaoRecebida)}</div>
                    </div>

                    {/* Barras duplas: Aluguel e Comissão */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Barra de Aluguel */}
                      <div
                        style={{ height: `${Math.max(item.alturaAluguelPct, 6)}%` }}
                        className={`w-1/2 max-w-[28px] rounded-t transition-all ${
                          isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                        title={`Aluguel: ${formatCurrency(item.totalAluguel)}`}
                      />
                      {/* Barra de Comissão Recebida */}
                      <div
                        style={{ height: `${Math.max(item.alturaComissaoPct, 6)}%` }}
                        className="w-1/2 max-w-[28px] bg-gradient-to-t from-red-800 to-red-600 hover:to-red-500 rounded-t transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                        title={`Comissão: ${formatCurrency(item.comissaoRecebida)}`}
                      />
                    </div>

                    {/* Rótulo do Mês */}
                    <span className={`text-[10px] font-semibold mt-2 truncate w-full text-center ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {item.mesLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`flex items-center justify-between text-[11px] px-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                <span>* Barras normalizadas para facilitar a comparação visual entre meses</span>
                <button
                  onClick={() => onNavigateToTab('pagamentos')}
                  className="text-red-500 hover:text-red-600 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  Ver lançamentos detalhados <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTRATOS QUE VENCEM NOS PRÓXIMOS 60 DIAS */}
        <div
          className={`lg:col-span-5 border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors ${
            isDark
              ? 'bg-[#121216] border-zinc-850 shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Contratos Vencendo (60 dias)
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                isDark ? 'bg-red-950/80 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {contratosVencendo.length}
              </span>
            </div>
            <p className={`text-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Imóveis com término de vigência próximo para renovação ou desocupação
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {contratosVencendo.length === 0 ? (
              <div className={`p-6 rounded-xl border text-center text-xs ${
                isDark ? 'bg-zinc-950/60 border-zinc-900 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <Clock className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Tudo em dia!</p>
                <p className="text-[11px] mt-1">
                  Nenhum contrato ativo tem vencimento previsto para os próximos 60 dias.
                </p>
              </div>
            ) : (
              contratosVencendo.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-zinc-950/80 border-zinc-850 hover:border-red-900/60'
                      : 'bg-slate-50 border-slate-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className={`text-xs font-bold truncate max-w-[190px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {c.nome}
                    </h4>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isDark ? 'bg-red-950 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      {c.diasRestantes === 0 ? 'Vence Hoje' : `Vence em ${c.diasRestantes} dias`}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between text-[11px] mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-zinc-400" /> Inquilino: {c.inquilino}
                    </span>
                    <span>Término: <strong className={isDark ? 'text-zinc-200' : 'text-slate-700'}>{formatDate(c.data_fim)}</strong></span>
                  </div>

                  <div className={`flex items-center justify-between pt-2 border-t text-xs ${isDark ? 'border-zinc-900' : 'border-slate-200'}`}>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                      Aluguel: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(c.valor_aluguel)}</strong>
                    </span>
                    <button
                      onClick={() => onNavigateToTab('imoveis')}
                      className="text-red-500 hover:text-red-600 font-semibold inline-flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      Gerenciar <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={`pt-4 border-t mt-4 flex items-center justify-between text-xs ${isDark ? 'border-zinc-900' : 'border-slate-100'}`}>
            <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>
              Ioncler Gestor de Imóveis
            </span>
            <button
              onClick={() => onNavigateToTab('imoveis')}
              className="text-xs text-red-500 hover:text-red-600 font-semibold cursor-pointer"
            >
              Ver todos os imóveis →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
