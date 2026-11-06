import { Imovel, Pagamento } from '../types';
import { calcularStatusParcela } from '../utils/formatters';

/**
 * Gera as parcelas mensais para um imóvel durante a vigência do contrato.
 * @param imovel Imóvel com datas de início e fim, valor de aluguel e comissão
 * @param idGenerator Função opcional para gerar UUIDs
 */
export function gerarParcelasContrato(
  imovel: Imovel,
  idGenerator: () => string = () => crypto.randomUUID()
): Pagamento[] {
  const parcelas: Pagamento[] = [];

  const [startYear, startMonth, startDay] = imovel.data_inicio.split('-').map(Number);
  const [endYear, endMonth, endDay] = imovel.data_fim.split('-').map(Number);

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);

  if (startDate > endDate) {
    return parcelas;
  }

  // O dia de vencimento é definido pelo campo dia_vencimento (1 a 31) ou pelo dia de início do contrato
  const dueDay = (imovel.dia_vencimento && imovel.dia_vencimento >= 1 && imovel.dia_vencimento <= 31)
    ? imovel.dia_vencimento
    : startDay;

  let currentYear = startYear;
  let currentMonth = startMonth - 1; // 0-indexed

  while (true) {
    const iterDate = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const actualDueDay = Math.min(dueDay, lastDayOfMonth);
    const dueDate = new Date(currentYear, currentMonth, actualDueDay);

    // Se a data de vencimento calculada estiver além da data de fim e além do mês de término, encerra
    if (new Date(currentYear, currentMonth, 1) > new Date(endYear, endMonth - 1, 1)) {
      break;
    }

    const mesReferencia = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const dataVencimentoStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

    const valorComissao = Number(((imovel.valor_aluguel * imovel.percentual_comissao) / 100).toFixed(2));
    const status = calcularStatusParcela('pendente', dataVencimentoStr);

    parcelas.push({
      id: idGenerator(),
      imovel_id: imovel.id,
      mes_referencia: mesReferencia,
      data_vencimento: dataVencimentoStr,
      valor_aluguel: imovel.valor_aluguel,
      percentual_comissao: imovel.percentual_comissao,
      valor_comissao: valorComissao,
      status: status,
      data_pagamento: null,
      imovel_nome: imovel.nome,
      inquilino: imovel.inquilino,
      proprietario: imovel.proprietario,
      created_at: new Date().toISOString(),
    });

    // Avança 1 mês
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return parcelas;
}
