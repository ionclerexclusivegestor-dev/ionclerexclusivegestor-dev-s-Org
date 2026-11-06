/**
 * Formatação de valores em Real brasileiro (R$)
 */
export function formatCurrency(value: number | string | undefined | null): string {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formata data no formato dd/mm/aaaa
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  // Lida tanto com YYYY-MM-DD quanto ISO strings
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formata mês de referência (YYYY-MM) para "Novembro/2026" ou "Novembro de 2026"
 */
export function formatMonthReference(mesRef: string, short: boolean = false): string {
  if (!mesRef) return '';
  const [yearStr, monthStr] = mesRef.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const nomeMes = meses[monthIdx] || mesRef;
  if (short) {
    return `${nomeMes.substring(0, 3)}/${year}`;
  }
  return `${nomeMes} de ${year}`;
}

/**
 * Obtém a data e hora atual no fuso horário de Brasília (America/Sao_Paulo)
 */
export function getBrasiliaDate(): Date {
  const now = new Date();
  // Cria data formatada no fuso de Brasília
  const brasiliaString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(brasiliaString);
}

/**
 * Retorna string YYYY-MM-DD da data atual de Brasília
 */
export function getBrasiliaTodayString(): string {
  const d = getBrasiliaDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna o mês atual YYYY-MM
 */
export function getCurrentMonthRef(): string {
  const d = getBrasiliaDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Saudação automática para o corretor Ioncler conforme horário de Brasília:
 * “Bom dia, Ioncler” das 5h às 11h59
 * “Boa tarde, Ioncler” das 12h às 17h59
 * “Boa noite, Ioncler” das 18h às 4h59
 */
export function getSaudacaoIoncler(): string {
  const d = getBrasiliaDate();
  const hour = d.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Bom dia, Ioncler';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde, Ioncler';
  } else {
    return 'Boa noite, Ioncler';
  }
}

/**
 * Data de hoje por extenso em português:
 * Ex: "Sexta-feira, 6 de novembro de 2026"
 */
export function getDataHojeExtenso(): string {
  const d = getBrasiliaDate();
  
  const diasSemana = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const diaSemana = diasSemana[d.getDay()];
  const dia = d.getDate();
  const mes = meses[d.getMonth()];
  const ano = d.getFullYear();

  return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
}

/**
 * Verifica se a parcela está atrasada:
 * Se status não for 'pago' e data_vencimento < hoje, está atrasada.
 */
export function calcularStatusParcela(statusAtual: string, dataVencimento: string): 'pago' | 'atrasado' | 'pendente' {
  if (statusAtual === 'pago') return 'pago';
  const hoje = getBrasiliaTodayString();
  if (dataVencimento < hoje) {
    return 'atrasado';
  }
  return 'pendente';
}

/**
 * Calcula a diferença em dias entre duas datas (dataFim - hoje)
 */
export function diasAteData(dataAlvo: string): number {
  const hoje = getBrasiliaTodayString();
  const dHoje = new Date(hoje + 'T00:00:00');
  const dAlvo = new Date(dataAlvo.split('T')[0] + 'T00:00:00');
  const diffTime = dAlvo.getTime() - dHoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula a data de fim do contrato automaticamente somando a quantidade de meses à data de início.
 * Padrão imobiliário: Início em 10/01/2026 com 12 meses -> Término em 09/01/2027.
 */
export function calcularDataFimContrato(dataInicioStr: string, meses: number): string {
  if (!dataInicioStr || meses <= 0) return '';
  const parts = dataInicioStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  // Data após N meses
  const targetDate = new Date(year, month + meses, day);
  // Subtrai 1 dia para fechar o ciclo de vigência
  targetDate.setDate(targetDate.getDate() - 1);

  const resYear = targetDate.getFullYear();
  const resMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const resDay = String(targetDate.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Calcula quanto tempo falta para o contrato terminar.
 * Ex: "faltam 5 meses", "falta 1 mês", "faltam 20 dias", ou "Encerrado".
 */
export function calcularTempoRestanteContrato(dataFimStr: string): string {
  if (!dataFimStr) return '-';
  const dias = diasAteData(dataFimStr);
  if (dias < 0) {
    return 'Encerrado';
  }
  if (dias === 0) {
    return 'Vence hoje';
  }
  const meses = Math.floor(dias / 30);
  if (meses >= 2) {
    return `faltam ${meses} meses`;
  } else if (meses === 1) {
    return 'falta 1 mês';
  } else {
    return `faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
}

/**
 * Calcula e formata quantos dias uma parcela está atrasada.
 * Ex: "12 dias de atraso"
 */
export function formatarDiasDeAtraso(dataVencimentoStr: string): string {
  if (!dataVencimentoStr) return '';
  const hoje = getBrasiliaTodayString();
  const dHoje = new Date(hoje + 'T00:00:00');
  const dVenc = new Date(dataVencimentoStr.split('T')[0] + 'T00:00:00');
  const diffTime = dHoje.getTime() - dVenc.getTime();
  const dias = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  if (dias === 0) return 'Venceu hoje';
  if (dias === 1) return '1 dia de atraso';
  return `${dias} dias de atraso`;
}

