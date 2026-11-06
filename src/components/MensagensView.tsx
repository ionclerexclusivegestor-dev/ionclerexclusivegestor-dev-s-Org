import React, { useState, useMemo } from 'react';
import {
  MessageSquareText,
  Send,
  Copy,
  Check,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Imovel, Pagamento } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { showToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';

interface MensagensViewProps {
  imoveis: Imovel[];
  pagamentos: Pagamento[];
}

type TipoModelo =
  | 'lembrete_vencimento'
  | 'cobranca_atraso'
  | 'recibo_pagamento'
  | 'repasse_proprietario'
  | 'renovacao_contrato';

interface ModeloMensagem {
  id: TipoModelo;
  titulo: string;
  descricao: string;
  destinatario: 'inquilino' | 'proprietario';
  icone: React.ComponentType<{ className?: string }>;
  tag: string;
  tagCorDark: string;
  tagCorLight: string;
}

export const MensagensView: React.FC<MensagensViewProps> = ({
  imoveis,
  pagamentos,
}) => {
  const { isDark } = useTheme();
  const [imovelSelecionadoId, setImovelSelecionadoId] = useState<string>(
    imoveis[0]?.id || ''
  );
  const [modeloSelecionado, setModeloSelecionado] = useState<TipoModelo>(
    'lembrete_vencimento'
  );
  const [telefone, setTelefone] = useState<string>('91981234567');
  const [textoEditado, setTextoEditado] = useState<string>('');
  const [copiado, setCopiado] = useState<boolean>(false);

  const imovelAtual = useMemo(() => {
    return imoveis.find((i) => i.id === imovelSelecionadoId) || imoveis[0];
  }, [imoveis, imovelSelecionadoId]);

  // Busca o pagamento atual ou atrasado mais recente do imóvel
  const pagamentoAtual = useMemo(() => {
    if (!imovelAtual) return null;
    const pagamentosImovel = pagamentos.filter((p) => p.imovel_id === imovelAtual.id);
    const atrasado = pagamentosImovel.find((p) => p.status === 'atrasado');
    if (atrasado) return atrasado;
    return pagamentosImovel[0] || null;
  }, [imovelAtual, pagamentos]);

  const modelos: ModeloMensagem[] = [
    {
      id: 'lembrete_vencimento',
      titulo: 'Lembrete de Vencimento',
      descricao: 'Lembrete cordial antes da data de vencimento do aluguel',
      destinatario: 'inquilino',
      icone: Clock,
      tag: 'Inquilino',
      tagCorDark: 'bg-amber-950/80 text-amber-300 border-amber-800',
      tagCorLight: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'cobranca_atraso',
      titulo: 'Aviso de Aluguel em Atraso',
      descricao: 'Notificação formal referente a pagamento vencido não identificado',
      destinatario: 'inquilino',
      icone: AlertCircle,
      tag: 'Cobrança',
      tagCorDark: 'bg-red-950/80 text-red-400 border-red-800',
      tagCorLight: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      id: 'recibo_pagamento',
      titulo: 'Confirmação de Pagamento',
      descricao: 'Agradecimento e confirmação de recebimento da parcela mensal',
      destinatario: 'inquilino',
      icone: CheckCircle2,
      tag: 'Recibo',
      tagCorDark: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
      tagCorLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'repasse_proprietario',
      titulo: 'Comprovante de Repasse ao Proprietário',
      descricao: 'Aviso de repasse líquido já deduzida a comissão de administração',
      destinatario: 'proprietario',
      icone: DollarSign,
      tag: 'Proprietário',
      tagCorDark: 'bg-blue-950/80 text-blue-300 border-blue-800',
      tagCorLight: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'renovacao_contrato',
      titulo: 'Aviso de Término / Renovação',
      descricao: 'Notificação de proximidade do fim do contrato de locação',
      destinatario: 'inquilino',
      icone: FileText,
      tag: 'Contrato',
      tagCorDark: 'bg-purple-950/80 text-purple-300 border-purple-800',
      tagCorLight: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  // Gera o texto padrão dinamicamente
  const textoGeradoPadrao = useMemo(() => {
    if (!imovelAtual) return '';

    const valorAluguel = formatCurrency(imovelAtual.valor_aluguel);
    const comissaoCorretor = formatCurrency(
      (imovelAtual.valor_aluguel * imovelAtual.percentual_comissao) / 100
    );
    const valorRepasseProprietario = formatCurrency(
      imovelAtual.valor_aluguel -
        (imovelAtual.valor_aluguel * imovelAtual.percentual_comissao) / 100
    );
    const vencimento = pagamentoAtual ? formatDate(pagamentoAtual.data_vencimento) : 'próximo dia útil';

    switch (modeloSelecionado) {
      case 'lembrete_vencimento':
        return `Olá, ${imovelAtual.inquilino}! Tudo bem?\n\nPassando para lembrar que o aluguel do imóvel *${imovelAtual.nome}* no valor de *${valorAluguel}* vence em *${vencimento}*.\n\nCaso já tenha efetuado o pagamento, por gentileza desconsidere este aviso ou nos envie o comprovante por aqui.\n\nAtenciosamente,\n*Ioncler Exclusive - Gestor de Imóveis*\nCRECI-PA 13.175`;

      case 'cobranca_atraso':
        return `Prezado(a) ${imovelAtual.inquilino},\n\nConstatamos em nosso sistema que a parcela de aluguel referente ao imóvel *${imovelAtual.nome}*, no valor de *${valorAluguel}*, com vencimento em *${vencimento}*, ainda consta em aberto.\n\nPedimos a gentileza de regularizar a pendência ou nos enviar o comprovante de pagamento caso já tenha sido liquidado.\n\nEstamos à disposição para qualquer esclarecimento.\n\n*Ioncler Exclusive - Gestor de Imóveis*\nCRECI-PA 13.175`;

      case 'recibo_pagamento':
        return `Olá, ${imovelAtual.inquilino}! Esperamos que esteja bem.\n\nConfirmamos com sucesso o recebimento do aluguel referente ao imóvel *${imovelAtual.nome}* no valor de *${valorAluguel}*.\n\nAgradecemos pela pontualidade e pela parceria!\n\nUm forte abraço,\n*Ioncler Exclusive - Gestor de Imóveis*\nCRECI-PA 13.175`;

      case 'repasse_proprietario':
        return `Prezado(a) ${imovelAtual.proprietario},\n\nInformamos que o aluguel do seu imóvel *${imovelAtual.nome}* foi recebido com sucesso.\n\n• Valor Bruto do Aluguel: ${valorAluguel}\n• Taxa de Administração (${imovelAtual.percentual_comissao}%): ${comissaoCorretor}\n• *Valor Líquido Repassado:* *${valorRepasseProprietario}*\n\nO repasse foi processado conforme acordado. Qualquer dúvida estamos à disposição.\n\nAtenciosamente,\n*Ioncler Exclusive - Gestor de Imóveis*\nCRECI-PA 13.175`;

      case 'renovacao_contrato':
        return `Prezado(a) ${imovelAtual.inquilino},\n\nO contrato de locação do imóvel *${imovelAtual.nome}* tem data de término prevista para *${formatDate(imovelAtual.data_fim)}*.\n\nGostaríamos de saber do seu interesse na renovação da locação para os próximos 12 meses, para elaborarmos o aditivo contratual com antecedência.\n\nAguardamos seu retorno para darmos andamento.\n\nAtenciosamente,\n*Ioncler Exclusive - Gestor de Imóveis*\nCRECI-PA 13.175`;

      default:
        return '';
    }
  }, [imovelAtual, pagamentoAtual, modeloSelecionado]);

  React.useEffect(() => {
    setTextoEditado(textoGeradoPadrao);
  }, [textoGeradoPadrao]);

  const handleCopiar = () => {
    navigator.clipboard.writeText(textoEditado);
    setCopiado(true);
    showToast('Mensagem copiada para a área de transferência!', 'success');
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleEnviarWhatsApp = () => {
    const textoCodificado = encodeURIComponent(textoEditado);
    const numeroLimpo = telefone.replace(/\D/g, '');
    let url = `https://wa.me/?text=${textoCodificado}`;
    if (numeroLimpo) {
      const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
      url = `https://wa.me/${numeroFinal}?text=${textoCodificado}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Abrindo WhatsApp com a mensagem pronta...', 'info');
  };

  return (
    <div className="w-full space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <MessageSquareText className="w-6 h-6 text-red-500" />
            Central de Mensagens & Comunicação
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Modelos inteligentes de cobrança, recibo e aviso de contrato prontos para envio via WhatsApp
          </p>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Seletor de Imóvel e Modelos */}
        <div className="lg:col-span-5 space-y-4">
          {/* Seletor de Imóvel */}
          <div className={`border rounded-2xl p-4 transition-colors ${
            isDark ? 'bg-[#121216] border-zinc-850 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Building2 className="w-4 h-4 text-red-500" />
              Selecione o Imóvel
            </label>
            <select
              value={imovelSelecionadoId}
              onChange={(e) => setImovelSelecionadoId(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-600 cursor-pointer ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {imoveis.map((imo) => (
                <option key={imo.id} value={imo.id} className={isDark ? 'bg-zinc-950 text-white' : 'bg-white text-slate-900'}>
                  {imo.nome} ({imo.inquilino})
                </option>
              ))}
            </select>

            {imovelAtual && (
              <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1 ${
                isDark ? 'bg-zinc-950/70 border-zinc-900' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Inquilino:</span>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{imovelAtual.inquilino}</strong>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Proprietário:</span>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{imovelAtual.proprietario}</strong>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Aluguel:</span>
                  <strong className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                    {formatCurrency(imovelAtual.valor_aluguel)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Modelos */}
          <div className={`border rounded-2xl p-4 space-y-2 transition-colors ${
            isDark ? 'bg-[#121216] border-zinc-850 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 px-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Modelos Rápidos de Mensagem
            </div>

            {modelos.map((m) => {
              const Icone = m.icone;
              const isAtivo = modeloSelecionado === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => setModeloSelecionado(m.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isAtivo
                      ? isDark
                        ? 'bg-red-950/40 border-red-600/80 shadow-md shadow-red-950/40'
                        : 'bg-red-50 border-red-500 shadow-sm'
                      : isDark
                      ? 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-750 text-zinc-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isAtivo
                        ? 'bg-red-600 text-white'
                        : isDark
                        ? 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    <Icone className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-bold ${
                        isAtivo ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-zinc-200' : 'text-slate-700')
                      }`}>
                        {m.titulo}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        isDark ? m.tagCorDark : m.tagCorLight
                      }`}>
                        {m.tag}
                      </span>
                    </div>
                    <p className={`text-[11px] line-clamp-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {m.descricao}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Editor de Mensagem */}
        <div className={`lg:col-span-7 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-colors ${
          isDark ? 'bg-[#121216] border-zinc-850 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Mensagem Gerada
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  isDark ? 'text-zinc-400 bg-zinc-900 border-zinc-800' : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}>
                  Totalmente editável
                </span>
              </div>

              <button
                onClick={() => setTextoEditado(textoGeradoPadrao)}
                className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer font-medium"
                title="Restaurar texto padrão"
              >
                <RefreshCw className="w-3 h-3" /> Restaurar Padrão
              </button>
            </div>

            {/* Telefone / WhatsApp */}
            <div className={`mb-3 flex items-center gap-2 p-2.5 rounded-xl border ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <Phone className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
              <span className={`text-xs whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                WhatsApp (com DDD):
              </span>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: 91981234567"
                className={`w-full bg-transparent text-xs font-medium focus:outline-none ${
                  isDark ? 'text-white placeholder-zinc-600' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Área de Texto da Mensagem */}
            <textarea
              rows={11}
              value={textoEditado}
              onChange={(e) => setTextoEditado(e.target.value)}
              className={`w-full p-4 rounded-xl border text-sm focus:outline-none focus:border-red-600 leading-relaxed resize-y font-mono ${
                isDark ? 'bg-black border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
              placeholder="Digite ou edite a mensagem..."
            />
          </div>

          {/* Botões de Ação */}
          <div className={`pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
            isDark ? 'border-zinc-900/90' : 'border-slate-100'
          }`}>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              * O envio abre diretamente o WhatsApp Web ou o app no celular
            </span>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleCopiar}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado ? 'Copiado!' : 'Copiar Texto'}
              </button>

              <button
                type="button"
                onClick={handleEnviarWhatsApp}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 border border-emerald-500 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
