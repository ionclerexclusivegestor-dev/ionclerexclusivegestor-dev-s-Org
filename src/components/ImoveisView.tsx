import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Building2,
  User,
  Calendar,
  Percent,
  FileText,
  Upload,
  Download,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  FileCheck,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  CalendarCheck,
} from 'lucide-react';
import { Imovel } from '../types';
import {
  formatCurrency,
  formatDate,
  calcularDataFimContrato,
  calcularTempoRestanteContrato,
} from '../utils/formatters';
import { StorageService } from '../services/storageService';
import { ModalConfirmacao } from './ModalConfirmacao';
import { showToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';

interface ImoveisViewProps {
  imoveis: Imovel[];
  onReload: () => Promise<void>;
  isLoading: boolean;
}

export const ImoveisView: React.FC<ImoveisViewProps> = ({
  imoveis,
  onReload,
  isLoading,
}) => {
  const { isDark } = useTheme();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [imovelEditando, setImovelEditando] = useState<Imovel | null>(null);

  // Confirmação de exclusão
  const [idParaExcluir, setIdParaExcluir] = useState<string | null>(null);
  const [nomeParaExcluir, setNomeParaExcluir] = useState<string>('');

  // Formulário State
  const [formNome, setFormNome] = useState('');
  const [formInquilino, setFormInquilino] = useState('');
  const [formProprietario, setFormProprietario] = useState('');
  const [formValorAluguel, setFormValorAluguel] = useState<string>('2500');
  const [formPercentualComissao, setFormPercentualComissao] = useState<string>('10');
  const [formDataInicio, setFormDataInicio] = useState('');
  const [formDataFim, setFormDataFim] = useState('');
  const [formDuracaoOpcao, setFormDuracaoOpcao] = useState<'6' | '12' | '24' | '36' | 'outro'>('12');
  const [formDuracaoOutro, setFormDuracaoOutro] = useState<string>('12');
  const [formDiaVencimento, setFormDiaVencimento] = useState<string>('10');
  const [formStatus, setFormStatus] = useState<'ativo' | 'encerrado'>('ativo');

  // Contrato Upload State
  const [contratoUrl, setContratoUrl] = useState<string | undefined>(undefined);
  const [contratoNome, setContratoNome] = useState<string | undefined>(undefined);
  const [contratoTipo, setContratoTipo] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submissão do form
  const [salvando, setSalvando] = useState(false);

  // Modal para visualização prévia de contrato
  const [previewContrato, setPreviewContrato] = useState<{ url: string; nome: string; tipo?: string } | null>(null);

  // Recalcula automaticamente a data de fim do contrato
  useEffect(() => {
    if (!formDataInicio) return;
    const meses = formDuracaoOpcao === 'outro'
      ? (parseInt(formDuracaoOutro, 10) || 12)
      : parseInt(formDuracaoOpcao, 10);
    const dataFimCalculada = calcularDataFimContrato(formDataInicio, meses);
    setFormDataFim(dataFimCalculada);
  }, [formDataInicio, formDuracaoOpcao, formDuracaoOutro]);

  const resetForm = () => {
    setFormNome('');
    setFormInquilino('');
    setFormProprietario('');
    setFormValorAluguel('2500');
    setFormPercentualComissao('10');

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const diaAtual = String(hoje.getDate()).padStart(2, '0');
    const inicioPadrao = `${anoAtual}-${mesAtual}-${diaAtual}`;
    setFormDataInicio(inicioPadrao);

    setFormDuracaoOpcao('12');
    setFormDuracaoOutro('12');
    setFormDiaVencimento(String(hoje.getDate()));

    const dataFimCalc = calcularDataFimContrato(inicioPadrao, 12);
    setFormDataFim(dataFimCalc);

    setFormStatus('ativo');
    setContratoUrl(undefined);
    setContratoNome(undefined);
    setContratoTipo(undefined);
    setImovelEditando(null);
  };

  const abrirModalNovo = () => {
    resetForm();
    setModalAberto(true);
  };

  const abrirModalEditar = (imovel: Imovel) => {
    setImovelEditando(imovel);
    setFormNome(imovel.nome);
    setFormInquilino(imovel.inquilino);
    setFormProprietario(imovel.proprietario);
    setFormValorAluguel(String(imovel.valor_aluguel));
    setFormPercentualComissao(String(imovel.percentual_comissao));
    setFormDataInicio(imovel.data_inicio);
    setFormDataFim(imovel.data_fim);

    // Ajusta o seletor de duração
    const meses = imovel.duracao_meses || 12;
    if (meses === 6 || meses === 12 || meses === 24 || meses === 36) {
      setFormDuracaoOpcao(String(meses) as any);
      setFormDuracaoOutro(String(meses));
    } else {
      setFormDuracaoOpcao('outro');
      setFormDuracaoOutro(String(meses));
    }

    setFormDiaVencimento(String(imovel.dia_vencimento || 10));
    setFormStatus(imovel.status);
    setContratoUrl(imovel.contrato_url);
    setContratoNome(imovel.contrato_nome);
    setContratoTipo(imovel.contrato_tipo);
    setModalAberto(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const resultado = await StorageService.uploadContrato(file);
      setContratoUrl(resultado.url);
      setContratoNome(resultado.nome);
      setContratoTipo(resultado.tipo);
      showToast('Arquivo de contrato carregado com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Falha no upload do contrato: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formInquilino.trim() || !formProprietario.trim()) {
      showToast('Preencha os campos obrigatórios do imóvel, inquilino e proprietário.', 'error');
      return;
    }

    if (!formDataInicio || !formDataFim) {
      showToast('Informe a data de início para calcular a vigência do contrato.', 'error');
      return;
    }

    const valorAluguel = parseFloat(formValorAluguel.replace(',', '.')) || 0;
    const percentualComissao = parseFloat(formPercentualComissao.replace(',', '.')) || 10;
    const duracaoFinal = formDuracaoOpcao === 'outro'
      ? (parseInt(formDuracaoOutro, 10) || 12)
      : parseInt(formDuracaoOpcao, 10);

    const diaVencNum = parseInt(formDiaVencimento, 10) || 10;
    if (diaVencNum < 1 || diaVencNum > 31) {
      showToast('O dia de vencimento do aluguel deve ser entre 1 e 31.', 'error');
      return;
    }

    if (valorAluguel <= 0) {
      showToast('O valor do aluguel deve ser maior que zero.', 'error');
      return;
    }

    try {
      setSalvando(true);
      const { imovel: salvo, novasParcelas } = await StorageService.saveImovel(
        {
          nome: formNome.trim(),
          inquilino: formInquilino.trim(),
          proprietario: formProprietario.trim(),
          valor_aluguel: valorAluguel,
          percentual_comissao: percentualComissao,
          data_inicio: formDataInicio,
          data_fim: formDataFim,
          duracao_meses: duracaoFinal,
          dia_vencimento: diaVencNum,
          contrato_url: contratoUrl,
          contrato_nome: contratoNome,
          contrato_tipo: contratoTipo,
          status: formStatus,
        },
        imovelEditando?.id
      );

      if (imovelEditando) {
        showToast(`Imóvel "${salvo.nome}" atualizado com sucesso!`, 'success');
      } else {
        const msgParcelas = novasParcelas.length > 0 ? ` e ${novasParcelas.length} parcelas mensais geradas!` : '!';
        showToast(`Imóvel cadastrado com sucesso${msgParcelas}`, 'success');
      }

      setModalAberto(false);
      resetForm();
      await onReload();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao salvar imóvel: ' + (err.message || 'Verifique sua conexão.'), 'error');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!idParaExcluir) return;
    try {
      await StorageService.deleteImovel(idParaExcluir);
      showToast(`Imóvel "${nomeParaExcluir}" excluído com sucesso.`, 'success');
      await onReload();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir imóvel: ' + (err.message || 'Erro inesperado.'), 'error');
    } finally {
      setIdParaExcluir(null);
    }
  };

  // Filtragem pela busca
  const imoveisFiltrados = imoveis.filter((imo) => {
    const q = busca.toLowerCase();
    return (
      imo.nome.toLowerCase().includes(q) ||
      imo.inquilino.toLowerCase().includes(q) ||
      imo.proprietario.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Barra de Ações: Título, Busca e Botão Novo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Building2 className="w-6 h-6 text-red-500" />
            Imóveis sob Gestão
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {imoveis.length} {imoveis.length === 1 ? 'imóvel' : 'imóveis'}
            </span>
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Gerencie os contratos de aluguel, tempo de vigência, dia de vencimento e comissões
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReload}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title="Recarregar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
          </button>
          <button
            onClick={abrirModalNovo}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-950/40 border border-red-500 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Imóvel
          </button>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="relative">
        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome do imóvel, inquilino ou proprietário..."
          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-red-600 transition-colors ${
            isDark
              ? 'bg-zinc-950/80 border-zinc-800 text-white placeholder-zinc-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
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

      {/* Lista de Imóveis (Grid de Cards) */}
      {imoveisFiltrados.length === 0 ? (
        <div
          className={`text-center py-16 px-4 border border-dashed rounded-2xl ${
            isDark ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400' : 'border-slate-300 bg-slate-50 text-slate-600'
          }`}
        >
          <Building2 className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {busca ? 'Nenhum imóvel encontrado para sua busca' : 'Nenhum imóvel cadastrado'}
          </h3>
          <p className="text-xs max-w-sm mx-auto mb-5">
            {busca
              ? 'Tente pesquisar com outro termo ou limpe o filtro.'
              : 'Cadastre o primeiro imóvel para gerar parcelas automáticas e gerenciar comissões.'}
          </p>
          {!busca && (
            <button
              onClick={abrirModalNovo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Imóvel
            </button>
          )}
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {imoveisFiltrados.map((imovel) => {
            const valorComissaoMensal = (imovel.valor_aluguel * imovel.percentual_comissao) / 100;
            const isAtivo = imovel.status === 'ativo';
            const duracaoMeses = imovel.duracao_meses || 12;
            const tempoRestante = calcularTempoRestanteContrato(imovel.data_fim);
            const diaVenc = imovel.dia_vencimento || 10;

            return (
              <div
                key={imovel.id}
                className={`group relative border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#121216] border-zinc-850 hover:border-red-900/60 shadow-xl'
                    : 'bg-white border-slate-200 hover:border-red-300 shadow-sm'
                }`}
              >
                {/* Linha vermelha no topo */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

                <div>
                  {/* Topo do Card: Status e Ações */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase border ${
                        isAtivo
                          ? isDark
                            ? 'bg-emerald-950/70 border-emerald-800 text-emerald-400'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : isDark
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {isAtivo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isAtivo ? 'Ativo' : 'Encerrado'}
                    </span>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => abrirModalEditar(imovel)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                        }`}
                        title="Editar Imóvel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIdParaExcluir(imovel.id);
                          setNomeParaExcluir(imovel.nome);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border-zinc-800'
                            : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-200'
                        }`}
                        title="Excluir Imóvel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Nome do Imóvel */}
                  <h3 className={`text-base font-black group-hover:text-red-500 transition-colors line-clamp-1 mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {imovel.nome}
                  </h3>

                  {/* Inquilino e Proprietário */}
                  <div className="space-y-2 text-xs mb-3">
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      isDark ? 'bg-zinc-950/60 border-zinc-900 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <User className="w-3.5 h-3.5 text-zinc-400" /> Inquilino:
                      </span>
                      <span className="font-semibold truncate max-w-[160px]">
                        {imovel.inquilino}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      isDark ? 'bg-zinc-950/60 border-zinc-900 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <User className="w-3.5 h-3.5 text-red-500" /> Proprietário:
                      </span>
                      <span className="font-semibold truncate max-w-[160px]">
                        {imovel.proprietario}
                      </span>
                    </div>
                  </div>

                  {/* Informações de Contrato: Duração e Quanto falta para acabar */}
                  <div className={`p-2.5 rounded-xl border mb-3 text-xs space-y-1.5 ${
                    isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <Clock className="w-3.5 h-3.5 text-zinc-400" /> Contrato:
                      </span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {duracaoMeses} meses
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Término:
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        tempoRestante.includes('Encerrado')
                          ? isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-slate-200 text-slate-700 border-slate-300'
                          : tempoRestante.includes('dia') || tempoRestante.includes('1 mês')
                          ? isDark ? 'bg-amber-950/70 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-200'
                          : isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {tempoRestante}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-900/60 text-[11px]">
                      <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                        Dia de vencimento:
                      </span>
                      <span className="font-extrabold text-red-500 flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3" /> Todo dia {diaVenc}
                      </span>
                    </div>
                  </div>

                  {/* Bloco de Valores */}
                  <div className={`p-3 rounded-xl border grid grid-cols-2 gap-2 mb-4 ${
                    isDark ? 'bg-zinc-950/90 border-zinc-900' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Aluguel</div>
                      <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(imovel.valor_aluguel)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-[11px] uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Comissão ({imovel.percentual_comissao}%)
                      </div>
                      <div className="text-sm font-extrabold text-red-500">
                        {formatCurrency(valorComissaoMensal)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contrato Anexo & Ações */}
                <div className={`pt-3 border-t flex items-center justify-between text-xs ${isDark ? 'border-zinc-900' : 'border-slate-100'}`}>
                  {imovel.contrato_url || imovel.contrato_nome ? (
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-[11px] truncate max-w-[140px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`} title={imovel.contrato_nome || 'Contrato'}>
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{imovel.contrato_nome || 'Contrato.pdf'}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic text-[11px] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Sem anexo
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {imovel.contrato_url && (
                      <>
                        <button
                          onClick={() =>
                            setPreviewContrato({
                              url: imovel.contrato_url!,
                              nome: imovel.contrato_nome || 'Contrato',
                              tipo: imovel.contrato_tipo,
                            })
                          }
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                          title="Visualizar Contrato"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={imovel.contrato_url}
                          download={imovel.contrato_nome || 'contrato'}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                          title="Baixar Contrato"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => abrirModalEditar(imovel)}
                      className={`px-2 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {imovel.contrato_url ? 'Substituir' : 'Anexar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NOVO / EDITAR IMÓVEL */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#101014] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Top Bar */}
            <div className={`flex items-center justify-between p-5 border-b ${
              isDark ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800/60 text-red-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {imovelEditando ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    A data de término e as parcelas são calculadas automaticamente com base no tempo de contrato
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSalvar} className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
              {/* Nome do Imóvel */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Nome do Imóvel *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Apto 302 - Ed. Mirante do Rio (Umarizal)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Inquilino e Proprietário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Nome do Inquilino *
                  </label>
                  <input
                    type="text"
                    required
                    value={formInquilino}
                    onChange={(e) => setFormInquilino(e.target.value)}
                    placeholder="Nome completo do inquilino"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Nome do Proprietário *
                  </label>
                  <input
                    type="text"
                    required
                    value={formProprietario}
                    onChange={(e) => setFormProprietario(e.target.value)}
                    placeholder="Nome completo do proprietário"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Aluguel e Comissão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Valor do Aluguel (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formValorAluguel}
                    onChange={(e) => setFormValorAluguel(e.target.value)}
                    placeholder="2500.00"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Percentual de Comissão (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      required
                      value={formPercentualComissao}
                      onChange={(e) => setFormPercentualComissao(e.target.value)}
                      placeholder="10"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 pr-9 ${
                        isDark
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  </div>
                  <span className={`text-[11px] mt-1 block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Comissão prevista:{' '}
                    <strong className="text-red-500">
                      {formatCurrency(
                        ((parseFloat(formValorAluguel) || 0) * (parseFloat(formPercentualComissao) || 10)) / 100
                      )}
                    </strong>{' '}
                    / mês
                  </span>
                </div>
              </div>

              {/* SEÇÃO AJUSTADA: Data de Início, Seletor de Tempo de Contrato e Dia de Vencimento */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-zinc-950/60 border-zinc-850' : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Data de Início */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Data de Início do Contrato *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDataInicio}
                      onChange={(e) => {
                        setFormDataInicio(e.target.value);
                        if (e.target.value) {
                          const dia = parseInt(e.target.value.split('-')[2], 10);
                          if (dia >= 1 && dia <= 31) {
                            setFormDiaVencimento(String(dia));
                          }
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Dia de Vencimento do Aluguel (1 a 31) */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Dia de Vencimento do Aluguel (1 a 31) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={formDiaVencimento}
                        onChange={(e) => setFormDiaVencimento(e.target.value)}
                        placeholder="Ex: 10"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-red-600 ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <CalendarCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Dia do mês em que a parcela vence e entra em atraso.
                    </span>
                  </div>
                </div>

                {/* Tempo de Contrato (Seletor com opções) */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Tempo de Contrato *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: '6', label: '6 meses' },
                      { id: '12', label: '12 meses' },
                      { id: '24', label: '24 meses (2 anos)' },
                      { id: '36', label: '36 meses (3 anos)' },
                      { id: 'outro', label: 'Outro' },
                    ].map((opt) => {
                      const isSel = formDuracaoOpcao === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormDuracaoOpcao(opt.id as any)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            isSel
                              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                              : isDark
                              ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo customizado se "Outro" */}
                  {formDuracaoOpcao === 'outro' && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Quantidade de meses:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={formDuracaoOutro}
                        onChange={(e) => setFormDuracaoOutro(e.target.value)}
                        className={`w-28 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-red-600 ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                        placeholder="Ex: 18"
                      />
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>meses</span>
                    </div>
                  )}

                  {/* Exibição automática da Data de Fim calculada */}
                  <div className={`mt-3 p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>
                      Data de término calculada automaticamente:
                    </span>
                    <strong className="text-red-500 font-bold">
                      {formatDate(formDataFim) || 'Preencha a data de início'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Status do Imóvel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('ativo')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formStatus === 'ativo'
                        ? isDark
                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : isDark
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('encerrado')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formStatus === 'encerrado'
                        ? isDark
                          ? 'bg-red-950/60 border-red-600 text-red-300'
                          : 'bg-red-50 border-red-500 text-red-700'
                        : isDark
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Encerrado
                  </button>
                </div>
              </div>

              {/* Contrato: Área de Upload */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Documento do Contrato (Salvo no Supabase Storage)
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDragOver
                      ? 'border-red-500 bg-red-950/20'
                      : contratoUrl
                      ? isDark ? 'border-emerald-800 bg-emerald-950/10' : 'border-emerald-300 bg-emerald-50'
                      : isDark
                      ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {isUploading ? (
                    <div className="py-2 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                      <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Enviando documento...</span>
                    </div>
                  ) : contratoUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2.5 rounded-full border ${isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {contratoNome || 'Contrato Anexado com Sucesso'}
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Clique ou arraste outro arquivo para substituir
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Upload className="w-7 h-7 text-red-500" />
                      <div className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                        Clique para anexar ou arraste o contrato aqui
                      </div>
                      <div className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        Suporta arquivos PDF, imagem (PNG, JPG) ou Word (.docx)
                      </div>
                    </div>
                  )}
                </div>

                {contratoUrl && (
                  <div className="mt-2 flex items-center justify-between text-xs px-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewContrato({
                          url: contratoUrl,
                          nome: contratoNome || 'Contrato',
                          tipo: contratoTipo,
                        })
                      }
                      className="text-red-500 hover:text-red-600 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Visualizar anexo atual
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContratoUrl(undefined);
                        setContratoNome(undefined);
                        setContratoTipo(undefined);
                      }}
                      className="text-zinc-400 hover:text-red-500 text-[11px] cursor-pointer"
                    >
                      Remover anexo
                    </button>
                  </div>
                )}
              </div>

              {/* Botões do Footer */}
              <div className={`pt-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-zinc-900' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'
                      : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-950/40 border border-red-500 transition-all cursor-pointer flex items-center gap-2"
                >
                  {salvando ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvando...
                    </>
                  ) : imovelEditando ? (
                    'Salvar Alterações'
                  ) : (
                    'Cadastrar e Gerar Parcelas'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE CONTRATO */}
      {previewContrato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2 font-semibold text-sm">
                <FileText className="w-4 h-4 text-red-500" />
                <span className="truncate max-w-md">{previewContrato.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewContrato.url}
                  download={previewContrato.nome}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </a>
                <button
                  onClick={() => setPreviewContrato(null)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={`flex-1 p-4 flex items-center justify-center overflow-auto min-h-[400px] ${isDark ? 'bg-black' : 'bg-slate-100'}`}>
              {previewContrato.url.startsWith('data:image/') ||
              previewContrato.url.includes('.png') ||
              previewContrato.url.includes('.jpg') ||
              previewContrato.url.includes('unsplash') ? (
                <img
                  src={previewContrato.url}
                  alt={previewContrato.nome}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg border border-zinc-700"
                />
              ) : (
                <iframe
                  src={previewContrato.url}
                  title="Documento de Contrato"
                  className="w-full h-[70vh] rounded-lg border border-zinc-700 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ModalConfirmacao
        isOpen={Boolean(idParaExcluir)}
        onClose={() => setIdParaExcluir(null)}
        onConfirm={handleConfirmarExclusao}
        titulo="Excluir Imóvel"
        mensagem={`Tem certeza que deseja excluir o imóvel "${nomeParaExcluir}"? Todas as parcelas e histórico de pagamentos vinculados a ele também serão excluídos permanentemente.`}
        textoConfirmar="Excluir Imóvel"
        isDestructive={true}
      />
    </div>
  );
};
