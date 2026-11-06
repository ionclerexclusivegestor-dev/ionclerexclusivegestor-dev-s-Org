import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Check,
  Undo2,
  DollarSign,
  Building,
  User,
  RefreshCw,
  AlertTriangle,
  CalendarCheck,
} from 'lucide-react';
import { Pagamento } from '../types';
import {
  formatCurrency,
  formatDate,
  formatMonthReference,
  getCurrentMonthRef,
  getBrasiliaTodayString,
  formatarDiasDeAtraso,
} from '../utils/formatters';
import { StorageService } from '../services/storageService';
import { showToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';

export type AbaPagamentos = 'atrasados' | 'a_receber' | 'pagos';

interface PagamentosViewProps {
  pagamentos: Pagamento[];
  onReload: () => Promise<void>;
  isLoading: boolean;
  abaInicial?: AbaPagamentos;
}

export const PagamentosView: React.FC<PagamentosViewProps> = ({
  pagamentos,
  onReload,
  isLoading,
  abaInicial = 'atrasados',
}) => {
  const { isDark } = useTheme();
  const hoje = getBrasiliaTodayString();
  const mesAtual = getCurrentMonthRef();

  // Abas do topo: Atrasados (padrão em destaque vermelho), A receber, Pagos
  const [abaAtiva, setAbaAtiva] = useState<AbaPagamentos>(abaInicial);
  // Filtro de mês/ano: 'padrao' (oculta meses futuros não solicitados) ou 'YYYY-MM'
  const [filtroMes, setFiltroMes] = useState<string>('padrao');
  const [busca, setBusca] = useState('');
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  // Sincroniza aba inicial quando alterada externamente (ex: clique no Dashboard)
  useEffect(() => {
    if (abaInicial) {
      setAbaAtiva(abaInicial);
    }
  }, [abaInicial]);

  // Lista de meses disponíveis a partir de todas as parcelas
  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    pagamentos.forEach((p) => {
      if (p.mes_referencia) set.add(p.mes_referencia);
    });
    set.add(mesAtual);
    return Array.from(set).sort();
  }, [pagamentos, mesAtual]);

  // Classificação das parcelas em tempo real:
  // 1. Atrasados: não pagas com data_vencimento < hoje
  // 2. A receber: não pagas com data_vencimento >= hoje (apenas mês atual por padrão, ou mês selecionado se escolhido)
  // 3. Pagos: status === 'pago'
  const { listaAtrasados, listaAReceber, listaPagos } = useMemo(() => {
    // 1. Atrasados: não pagos com vencimento já passado, da mais antiga para a mais recente
    const atrasados = pagamentos
      .filter((p) => {
        if (p.status === 'pago') return false;
        if (p.data_vencimento >= hoje) return false;
        if (filtroMes !== 'padrao' && p.mes_referencia !== filtroMes) return false;
        return true;
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

    // 2. A receber: parcelas pendentes que ainda não venceram
    // Regra: por padrão, apenas do mês atual. Se o usuário escolher um mês futuro no filtro, exibe daquele mês.
    const aReceber = pagamentos
      .filter((p) => {
        if (p.status === 'pago') return false;
        if (p.data_vencimento < hoje) return false;

        if (filtroMes === 'padrao') {
          // Apenas parcelas do mês atual que ainda não venceram (evita poluição de meses futuros)
          return p.mes_referencia === mesAtual;
        } else {
          // Se o usuário selecionou um mês específico no filtro
          return p.mes_referencia === filtroMes;
        }
      })
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

    // 3. Pagos: parcelas já pagas, da mais recente para a mais antiga
    const pagos = pagamentos
      .filter((p) => {
        if (p.status !== 'pago') return false;
        if (filtroMes !== 'padrao' && p.mes_referencia !== filtroMes) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.data_pagamento || a.data_vencimento).getTime();
        const dateB = new Date(b.data_pagamento || b.data_vencimento).getTime();
        return dateB - dateA;
      });

    return {
      listaAtrasados: atrasados,
      listaAReceber: aReceber,
      listaPagos: pagos,
    };
  }, [pagamentos, hoje, mesAtual, filtroMes]);

  // Parcelas ativas na aba atual + aplicação de busca textual
  const parcelasExibidas = useMemo(() => {
    let base: Pagamento[] = [];
    if (abaAtiva === 'atrasados') base = listaAtrasados;
    else if (abaAtiva === 'a_receber') base = listaAReceber;
    else base = listaPagos;

    if (!busca.trim()) return base;

    const q = busca.toLowerCase();
    return base.filter((p) => {
      const imovel = (p.imovel_nome || '').toLowerCase();
      const inquilino = (p.inquilino || '').toLowerCase();
      return imovel.includes(q) || inquilino.includes(q);
    });
  }, [abaAtiva, listaAtrasados, listaAReceber, listaPagos, busca]);

  // Ação de Marcar como Pago ou Desfazer
  const handleToggleStatus = async (parcela: Pagamento) => {
    const isPago = parcela.status === 'pago';
    const novoStatus = isPago ? 'pendente' : 'pago';

    try {
      setProcessandoId(parcela.id);
      await StorageService.togglePagamentoStatus(parcela.id, novoStatus, hoje);

      if (novoStatus === 'pago') {
        showToast(`Pagamento de ${parcela.imovel_nome} registrado como Pago!`, 'success');
      } else {
        showToast(`Pagamento desfeito com sucesso. Parcela retornou ao status pendente.`, 'info');
      }
      await onReload();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao atualizar status do pagamento: ' + (err.message || 'Falha de conexão'), 'error');
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Título e Ações Superiores */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <DollarSign className="w-6 h-6 text-red-500" />
            Pagamentos Mensais
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Controle de parcelas por abas: atrasados, a receber e recebidos
          </p>
        </div>

        <button
          onClick={onReload}
          disabled={isLoading}
          className={`self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* 3 ABAS NO TOPO COM CONTADORES (ATRASADOS EM DESTAQUE VERMELHO DE ALTO CONTRASTE) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Aba 1: Atrasados (Destaque Vermelho) */}
        <button
          onClick={() => setAbaAtiva('atrasados')}
          className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between cursor-pointer relative overflow-hidden group ${
            abaAtiva === 'atrasados'
              ? 'bg-red-50 border-red-600 shadow-md ring-2 ring-red-500/20'
              : 'bg-white border-slate-200 hover:border-red-300 hover:bg-red-50/30 shadow-sm'
          }`}
        >
          {abaAtiva === 'atrasados' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600" />
          )}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              abaAtiva === 'atrasados'
                ? 'bg-red-600 text-white border-red-700 shadow-sm'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5 ${
                abaAtiva === 'atrasados' ? 'text-red-900' : 'text-red-600'
              }`}>
                Atrasados
                {listaAtrasados.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                )}
              </div>
              <div className={`text-xs font-medium ${
                abaAtiva === 'atrasados' ? 'text-red-800' : 'text-slate-500'
              }`}>
                Vencimento já passado
              </div>
            </div>
          </div>

          <div className={`text-2xl font-black px-3.5 py-1 rounded-xl border ${
            abaAtiva === 'atrasados'
              ? 'bg-red-600 text-white border-red-700 shadow-sm'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {listaAtrasados.length}
          </div>
        </button>

        {/* Aba 2: A receber */}
        <button
          onClick={() => setAbaAtiva('a_receber')}
          className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between cursor-pointer relative overflow-hidden group ${
            abaAtiva === 'a_receber'
              ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 shadow-sm'
          }`}
        >
          {abaAtiva === 'a_receber' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          )}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              abaAtiva === 'a_receber'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs uppercase tracking-wider font-extrabold ${
                abaAtiva === 'a_receber' ? 'text-amber-950' : 'text-slate-700'
              }`}>
                A receber
              </div>
              <div className={`text-xs font-medium ${
                abaAtiva === 'a_receber' ? 'text-amber-800' : 'text-slate-500'
              }`}>
                {filtroMes === 'padrao' ? 'Mês atual a vencer' : 'Mês selecionado a vencer'}
              </div>
            </div>
          </div>

          <div className={`text-2xl font-black px-3.5 py-1 rounded-xl border ${
            abaAtiva === 'a_receber'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {listaAReceber.length}
          </div>
        </button>

        {/* Aba 3: Pagos */}
        <button
          onClick={() => setAbaAtiva('pagos')}
          className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between cursor-pointer relative overflow-hidden group ${
            abaAtiva === 'pagos'
              ? 'bg-emerald-50 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-sm'
          }`}
        >
          {abaAtiva === 'pagos' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
          )}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              abaAtiva === 'pagos'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs uppercase tracking-wider font-extrabold ${
                abaAtiva === 'pagos' ? 'text-emerald-950' : 'text-slate-700'
              }`}>
                Pagos
              </div>
              <div className={`text-xs font-medium ${
                abaAtiva === 'pagos' ? 'text-emerald-800' : 'text-slate-500'
              }`}>
                Parcelas já liquidadas
              </div>
            </div>
          </div>

          <div className={`text-2xl font-black px-3.5 py-1 rounded-xl border ${
            abaAtiva === 'pagos'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {listaPagos.length}
          </div>
        </button>
      </div>

      {/* BARRA DE FILTROS: Busca por Imóvel/Inquilino + Filtro por Mês/Ano */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
        isDark ? 'bg-[#121216] border-zinc-850 shadow-md' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do imóvel ou do inquilino nesta aba..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 transition-colors ${
              isDark
                ? 'bg-zinc-950/80 border-zinc-800 text-white placeholder-zinc-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs hover:text-red-500 cursor-pointer ${
                isDark ? 'text-zinc-500' : 'text-slate-400'
              }`}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filtro por Mês / Ano */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-red-500 shrink-0" />
          <span className={`text-xs font-semibold whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Filtro de Mês:
          </span>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-red-600 cursor-pointer ${
              isDark
                ? 'bg-zinc-950 border-zinc-800 text-white'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="padrao">Padrão (Sem poluição futura)</option>
            {mesesDisponiveis.map((m) => (
              <option key={m} value={m} className={isDark ? 'bg-zinc-950 text-white' : 'bg-white text-slate-900'}>
                {formatMonthReference(m)} {m === mesAtual ? '(Mês Atual)' : ''}
              </option>
            ))}
          </select>
          {filtroMes !== 'padrao' && (
            <button
              onClick={() => setFiltroMes('padrao')}
              className={`text-xs px-2 py-1.5 rounded-lg border font-medium cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-red-400 border-zinc-800'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              Resetar
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE PARCELAS EMPILHADAS (CARDS RESPONSIVOS E ADAPTADOS PARA CELULAR) */}
      {parcelasExibidas.length === 0 ? (
        <div
          className={`text-center py-16 px-4 border border-dashed rounded-2xl ${
            isDark ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400' : 'border-slate-300 bg-slate-50 text-slate-600'
          }`}
        >
          {abaAtiva === 'atrasados' ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          ) : (
            <Calendar className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          )}
          <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {abaAtiva === 'atrasados'
              ? 'Nenhuma parcela em atraso!'
              : abaAtiva === 'a_receber'
              ? 'Nenhuma parcela pendente a receber para o período'
              : 'Nenhuma parcela paga cadastrada'}
          </h3>
          <p className="text-xs max-w-sm mx-auto">
            {busca
              ? 'Nenhum resultado corresponde à sua pesquisa nesta aba.'
              : abaAtiva === 'atrasados'
              ? 'Parabéns, todos os aluguéis com vencimento passado estão em dia ou foram quitados.'
              : abaAtiva === 'a_receber'
              ? 'Não há aluguéis a vencer neste filtro.'
              : 'Marque parcelas como "Pago" para registrá-las nesta lista.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {parcelasExibidas.map((parcela) => {
            const isPago = parcela.status === 'pago';
            const isAtrasado = abaAtiva === 'atrasados' || parcela.data_vencimento < hoje;
            const isProcessando = processandoId === parcela.id;
            const diasAtrasoTexto = formatarDiasDeAtraso(parcela.data_vencimento);

            return (
              <div
                key={parcela.id}
                className={`group relative border rounded-2xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isPago
                    ? isDark
                      ? 'border-emerald-950/60 bg-emerald-950/10'
                      : 'border-emerald-200 bg-emerald-50/40 shadow-sm'
                    : isAtrasado
                    ? isDark
                      ? 'border-red-900/80 bg-red-950/20 shadow-md shadow-red-950/20'
                      : 'border-red-300 bg-red-50/60 shadow-sm'
                    : isDark
                    ? 'bg-[#121216] border-zinc-850 hover:border-zinc-700 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Linha indicadora lateral */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${
                    isPago ? 'bg-emerald-500' : isAtrasado ? 'bg-red-600' : 'bg-amber-500'
                  }`}
                />

                {/* Bloco de Informações: Imóvel, Inquilino, Vencimento e Dias de Atraso */}
                <div className="pl-2 space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-base font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Building className="w-4 h-4 text-zinc-400 shrink-0" />
                      {parcela.imovel_nome || 'Imóvel'}
                    </h3>

                    {/* Mês de Referência */}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      Ref: {formatMonthReference(parcela.mes_referencia, true)}
                    </span>

                    {/* Badge de Atraso em destaque com dias */}
                    {isAtrasado && !isPago && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-sm shadow-red-900/50 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        {diasAtrasoTexto}
                      </span>
                    )}

                    {/* Badge de Pago */}
                    {isPago && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        isDark ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        Pago {parcela.data_pagamento ? `em ${formatDate(parcela.data_pagamento)}` : ''}
                      </span>
                    )}
                  </div>

                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      Inquilino: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{parcela.inquilino}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5 text-red-500" />
                      Vencimento: <strong className={isAtrasado && !isPago ? 'text-red-500 font-bold' : isDark ? 'text-zinc-200' : 'text-slate-800'}>
                        {formatDate(parcela.data_vencimento)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Bloco de Valores (Aluguel e Comissão) e Botão de Ação Destacado */}
                <div className={`pl-2 lg:pl-0 flex items-center justify-between lg:justify-end gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 ${
                  isDark ? 'border-zinc-900' : 'border-slate-100'
                }`}>
                  <div className="text-left sm:text-right">
                    <div className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Valor do Aluguel
                    </div>
                    <div className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(parcela.valor_aluguel)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Comissão ({parcela.percentual_comissao}%)
                    </div>
                    <div className="text-sm sm:text-base font-black text-red-500">
                      {formatCurrency(parcela.valor_comissao)}
                    </div>
                  </div>

                  {/* Botão de Ação: "Pago" bem visível no celular e desktop, ou "Desfazer" na aba de Pagos */}
                  <div className="shrink-0">
                    {isPago ? (
                      <button
                        onClick={() => handleToggleStatus(parcela)}
                        disabled={isProcessando}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title="Desfazer e devolver parcela para A receber / Atrasados"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Desfazer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(parcela)}
                        disabled={isProcessando}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 border border-emerald-500 transition-all cursor-pointer"
                      >
                        {isProcessando ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 stroke-[3]" />
                        )}
                        <span>Pago</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
