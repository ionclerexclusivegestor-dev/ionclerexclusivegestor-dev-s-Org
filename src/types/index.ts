export interface Imovel {
  id: string;
  nome: string;
  inquilino: string;
  proprietario: string;
  valor_aluguel: number;
  percentual_comissao: number; // Ex: 10 para 10%
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  duracao_meses?: number; // Ex: 6, 12, 24, 36
  dia_vencimento?: number; // 1 a 31
  contrato_url?: string;
  contrato_nome?: string;
  contrato_tipo?: string;
  status: 'ativo' | 'encerrado';
  created_at?: string;
}

export type StatusPagamento = 'pendente' | 'pago' | 'atrasado';

export interface Pagamento {
  id: string;
  imovel_id: string;
  mes_referencia: string; // YYYY-MM
  data_vencimento: string; // YYYY-MM-DD
  valor_aluguel: number;
  percentual_comissao: number;
  valor_comissao: number; // valor_aluguel * (percentual_comissao / 100)
  status: StatusPagamento;
  data_pagamento?: string | null; // YYYY-MM-DD
  observacao?: string;
  created_at?: string;
  // Joins / campos extras para exibição
  imovel_nome?: string;
  inquilino?: string;
  proprietario?: string;
}

export type TipoPeriodo = 'hoje' | '7dias' | '30dias' | '3meses' | 'personalizado';

export interface FiltroPeriodo {
  tipo: TipoPeriodo;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
}
