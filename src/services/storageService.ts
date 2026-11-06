import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Imovel, Pagamento } from '../types';
import { gerarParcelasContrato } from './contractGenerator';
import { calcularStatusParcela, getBrasiliaTodayString } from '../utils/formatters';

const STORAGE_KEY_IMOVEIS = 'ioncler_imoveis_data';
const STORAGE_KEY_PAGAMENTOS = 'ioncler_pagamentos_data';

// Dados de demonstração iniciais realistas para Ioncler (CRECI-PA 13.175)
const SEED_IMOVEIS: Imovel[] = [
  {
    id: 'imo-1',
    nome: 'Apto 1204 - Ed. Mirante do Rio (Umarizal)',
    inquilino: 'Dra. Camila Vasconcelos',
    proprietario: 'Eng. Roberto Mendonça',
    valor_aluguel: 3800,
    percentual_comissao: 10,
    data_inicio: '2026-01-10',
    data_fim: '2027-01-09',
    duracao_meses: 12,
    dia_vencimento: 10,
    status: 'ativo',
    contrato_nome: 'Contrato_Aluguel_Mirante1204.pdf',
    contrato_tipo: 'application/pdf',
    contrato_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'imo-2',
    nome: 'Casa Cond. Greenville II - Rod. Augusto Montenegro',
    inquilino: 'Lucas Albuquerque & Família',
    proprietario: 'Dra. Maria Helena Farias',
    valor_aluguel: 6500,
    percentual_comissao: 12,
    data_inicio: '2026-02-05',
    data_fim: '2027-02-04',
    duracao_meses: 12,
    dia_vencimento: 5,
    status: 'ativo',
    contrato_nome: 'Contrato_Locacao_Greenville_Assinado.pdf',
    contrato_tipo: 'application/pdf',
    contrato_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-02-05T10:30:00Z',
  },
  {
    id: 'imo-3',
    nome: 'Sala Comercial 802 - Evolution Business Center',
    inquilino: 'Consultoria Norte Digital Ltda',
    proprietario: 'Dr. Paulo Siqueira',
    valor_aluguel: 2400,
    percentual_comissao: 10,
    data_inicio: '2025-12-01',
    data_fim: '2026-11-30', // Vence em breve (fim de nov/2026)
    duracao_meses: 12,
    dia_vencimento: 1,
    status: 'ativo',
    contrato_nome: 'Contrato_Comercial_Sala802.pdf',
    contrato_tipo: 'application/pdf',
    created_at: '2025-12-01T09:00:00Z',
  },
  {
    id: 'imo-4',
    nome: 'Cobertura Duplex - Ed. Aquarius Tower (Nazaré)',
    inquilino: 'Dr. Fernando Paiva',
    proprietario: 'Carlos Eduardo Barreto',
    valor_aluguel: 8200,
    percentual_comissao: 10,
    data_inicio: '2026-03-15',
    data_fim: '2027-03-14',
    duracao_meses: 12,
    dia_vencimento: 15,
    status: 'ativo',
    contrato_nome: 'Contrato_Cobertura_Aquarius.pdf',
    contrato_tipo: 'application/pdf',
    created_at: '2026-03-15T11:00:00Z',
  },
  {
    id: 'imo-5',
    nome: 'Loja Térrea - Av. Braz de Aguiar',
    inquilino: 'Café & Bistrô Aromas',
    proprietario: 'Imobiliária & Participações PA',
    valor_aluguel: 4500,
    percentual_comissao: 8,
    data_inicio: '2025-05-01',
    data_fim: '2026-04-30',
    duracao_meses: 12,
    dia_vencimento: 1,
    status: 'encerrado',
    created_at: '2025-05-01T14:00:00Z',
  },
];

function initLocalStorageData(): { imoveis: Imovel[]; pagamentos: Pagamento[] } {
  const storedImoveis = localStorage.getItem(STORAGE_KEY_IMOVEIS);
  const storedPagamentos = localStorage.getItem(STORAGE_KEY_PAGAMENTOS);

  if (storedImoveis && storedPagamentos) {
    try {
      const imoveisRaw: Imovel[] = JSON.parse(storedImoveis);
      const pagamentos: Pagamento[] = JSON.parse(storedPagamentos);
      const imoveis: Imovel[] = imoveisRaw.map((i: any) => ({
        ...i,
        duracao_meses: i.duracao_meses || 12,
        dia_vencimento: i.dia_vencimento || (i.data_inicio ? parseInt(i.data_inicio.split('-')[2], 10) : 10),
      }));
      return { imoveis, pagamentos };
    } catch {
      // Fallback
    }
  }

  // Gera dados iniciais
  const imoveis = [...SEED_IMOVEIS];
  let allPagamentos: Pagamento[] = [];

  for (const imo of imoveis) {
    const parcelas = gerarParcelasContrato(imo, () => `pag-${Math.random().toString(36).substring(2, 9)}`);
    // Simula pagamentos passados como pagos
    const hoje = getBrasiliaTodayString();
    for (const p of parcelas) {
      if (p.data_vencimento < '2026-11-01') {
        p.status = 'pago';
        p.data_pagamento = p.data_vencimento;
      } else if (p.mes_referencia === '2026-11') {
        // Mês atual: uma paga, outras pendentes ou vencidas
        if (imo.id === 'imo-1') {
          p.status = 'pago';
          p.data_pagamento = '2026-11-05';
        } else if (p.data_vencimento < hoje) {
          p.status = 'atrasado';
        } else {
          p.status = 'pendente';
        }
      } else if (p.data_vencimento < hoje) {
        p.status = 'atrasado';
      }
    }
    allPagamentos = [...allPagamentos, ...parcelas];
  }

  localStorage.setItem(STORAGE_KEY_IMOVEIS, JSON.stringify(imoveis));
  localStorage.setItem(STORAGE_KEY_PAGAMENTOS, JSON.stringify(allPagamentos));

  return { imoveis, pagamentos: allPagamentos };
}

export const StorageService = {
  isUsingSupabase(): boolean {
    return isSupabaseConfigured();
  },

  async getImoveis(): Promise<Imovel[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar imóveis no Supabase:', error);
        throw error;
      }
      return data || [];
    }

    // LocalStorage fallback
    const { imoveis } = initLocalStorageData();
    return imoveis;
  },

  async saveImovel(
    dadosImovel: Omit<Imovel, 'id' | 'created_at'>,
    idExistente?: string
  ): Promise<{ imovel: Imovel; novasParcelas: Pagamento[] }> {
    if (isSupabaseConfigured() && supabase) {
      let savedImovel: Imovel;
      let novasParcelas: Pagamento[] = [];

      if (idExistente) {
        // Atualização
        const { data, error } = await supabase
          .from('imoveis')
          .update({
            nome: dadosImovel.nome,
            inquilino: dadosImovel.inquilino,
            proprietario: dadosImovel.proprietario,
            valor_aluguel: dadosImovel.valor_aluguel,
            percentual_comissao: dadosImovel.percentual_comissao,
            data_inicio: dadosImovel.data_inicio,
            data_fim: dadosImovel.data_fim,
            duracao_meses: dadosImovel.duracao_meses,
            dia_vencimento: dadosImovel.dia_vencimento,
            contrato_url: dadosImovel.contrato_url,
            contrato_nome: dadosImovel.contrato_nome,
            contrato_tipo: dadosImovel.contrato_tipo,
            status: dadosImovel.status,
          })
          .eq('id', idExistente)
          .select()
          .single();

        if (error) throw error;
        savedImovel = data;
      } else {
        // Inserção
        const { data, error } = await supabase
          .from('imoveis')
          .insert([dadosImovel])
          .select()
          .single();

        if (error) throw error;
        savedImovel = data;

        // Se ativo, gera parcelas automáticas
        if (savedImovel.status === 'ativo') {
          const parcelasParaInserir = gerarParcelasContrato(savedImovel);
          const payload = parcelasParaInserir.map((p) => ({
            imovel_id: savedImovel.id,
            mes_referencia: p.mes_referencia,
            data_vencimento: p.data_vencimento,
            valor_aluguel: p.valor_aluguel,
            percentual_comissao: p.percentual_comissao,
            valor_comissao: p.valor_comissao,
            status: p.status,
            data_pagamento: null,
          }));

          const { data: parcelasData, error: parcelasError } = await supabase
            .from('pagamentos')
            .insert(payload)
            .select();

          if (parcelasError) {
            console.error('Erro ao gerar parcelas no Supabase:', parcelasError);
          } else {
            novasParcelas = (parcelasData || []).map((p) => ({
              ...p,
              imovel_nome: savedImovel.nome,
              inquilino: savedImovel.inquilino,
              proprietario: savedImovel.proprietario,
            }));
          }
        }
      }

      return { imovel: savedImovel, novasParcelas };
    }

    // LocalStorage fallback
    const { imoveis, pagamentos } = initLocalStorageData();
    let updatedImoveis = [...imoveis];
    let novasParcelas: Pagamento[] = [];
    let savedImovel: Imovel;

    if (idExistente) {
      const idx = updatedImoveis.findIndex((i) => i.id === idExistente);
      if (idx >= 0) {
        savedImovel = {
          ...updatedImoveis[idx],
          ...dadosImovel,
        };
        updatedImoveis[idx] = savedImovel;
      } else {
        throw new Error('Imóvel não encontrado');
      }
    } else {
      savedImovel = {
        ...dadosImovel,
        id: crypto.randomUUID ? crypto.randomUUID() : `imo-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      updatedImoveis.unshift(savedImovel);

      // Gera parcelas automáticas se ativo
      if (savedImovel.status === 'ativo') {
        novasParcelas = gerarParcelasContrato(savedImovel);
      }
    }

    localStorage.setItem(STORAGE_KEY_IMOVEIS, JSON.stringify(updatedImoveis));
    if (novasParcelas.length > 0) {
      localStorage.setItem(STORAGE_KEY_PAGAMENTOS, JSON.stringify([...novasParcelas, ...pagamentos]));
    }

    return { imovel: savedImovel, novasParcelas };
  },

  async deleteImovel(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('imoveis').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    // LocalStorage fallback
    const { imoveis, pagamentos } = initLocalStorageData();
    const filteredImoveis = imoveis.filter((i) => i.id !== id);
    const filteredPagamentos = pagamentos.filter((p) => p.imovel_id !== id);

    localStorage.setItem(STORAGE_KEY_IMOVEIS, JSON.stringify(filteredImoveis));
    localStorage.setItem(STORAGE_KEY_PAGAMENTOS, JSON.stringify(filteredPagamentos));
  },

  async getPagamentos(): Promise<Pagamento[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          *,
          imoveis:imovel_id (
            nome,
            inquilino,
            proprietario
          )
        `)
        .order('data_vencimento', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pagamentos no Supabase:', error);
        throw error;
      }

      return (data || []).map((p: any) => {
        const statusCalculado = calcularStatusParcela(p.status, p.data_vencimento);
        return {
          id: p.id,
          imovel_id: p.imovel_id,
          mes_referencia: p.mes_referencia,
          data_vencimento: p.data_vencimento,
          valor_aluguel: Number(p.valor_aluguel),
          percentual_comissao: Number(p.percentual_comissao),
          valor_comissao: Number(p.valor_comissao),
          status: statusCalculado,
          data_pagamento: p.data_pagamento,
          observacao: p.observacao,
          created_at: p.created_at,
          imovel_nome: p.imoveis?.nome || 'Imóvel',
          inquilino: p.imoveis?.inquilino || 'Inquilino',
          proprietario: p.imoveis?.proprietario || 'Proprietário',
        };
      });
    }

    // LocalStorage fallback
    const { pagamentos, imoveis } = initLocalStorageData();
    const imovelMap = new Map(imoveis.map((i) => [i.id, i]));

    return pagamentos.map((p) => {
      const imovel = imovelMap.get(p.imovel_id);
      const statusCalculado = calcularStatusParcela(p.status, p.data_vencimento);
      return {
        ...p,
        status: statusCalculado,
        imovel_nome: imovel?.nome || p.imovel_nome || 'Imóvel',
        inquilino: imovel?.inquilino || p.inquilino || 'Inquilino',
        proprietario: imovel?.proprietario || p.proprietario || 'Proprietário',
      };
    });
  },

  async togglePagamentoStatus(
    id: string,
    novoStatus: 'pago' | 'pendente',
    dataPagamento?: string
  ): Promise<Pagamento> {
    const dataRegistrada = novoStatus === 'pago' ? (dataPagamento || getBrasiliaTodayString()) : null;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('pagamentos')
        .update({
          status: novoStatus,
          data_pagamento: dataRegistrada,
        })
        .eq('id', id)
        .select(`
          *,
          imoveis:imovel_id (
            nome,
            inquilino,
            proprietario
          )
        `)
        .single();

      if (error) throw error;
      const statusFinal = calcularStatusParcela(data.status, data.data_vencimento);
      return {
        ...data,
        status: statusFinal,
        imovel_nome: data.imoveis?.nome,
        inquilino: data.imoveis?.inquilino,
        proprietario: data.imoveis?.proprietario,
      };
    }

    // LocalStorage fallback
    const { pagamentos, imoveis } = initLocalStorageData();
    const imovelMap = new Map(imoveis.map((i) => [i.id, i]));
    const idx = pagamentos.findIndex((p) => p.id === id);

    if (idx < 0) {
      throw new Error('Pagamento não encontrado');
    }

    const item = pagamentos[idx];
    const statusFinal = calcularStatusParcela(novoStatus, item.data_vencimento);
    const atualizado: Pagamento = {
      ...item,
      status: statusFinal,
      data_pagamento: dataRegistrada,
      imovel_nome: imovelMap.get(item.imovel_id)?.nome || item.imovel_nome,
      inquilino: imovelMap.get(item.imovel_id)?.inquilino || item.inquilino,
      proprietario: imovelMap.get(item.imovel_id)?.proprietario || item.proprietario,
    };

    pagamentos[idx] = atualizado;
    localStorage.setItem(STORAGE_KEY_PAGAMENTOS, JSON.stringify(pagamentos));

    return atualizado;
  },

  async uploadContrato(file: File): Promise<{ url: string; nome: string; tipo: string }> {
    const nomeLimpo = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const caminho = `${Date.now()}_${nomeLimpo}`;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.storage
        .from('contratos')
        .upload(caminho, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Erro no upload Supabase Storage:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage.from('contratos').getPublicUrl(data.path);
      return {
        url: urlData.publicUrl,
        nome: file.name,
        tipo: file.type || 'application/octet-stream',
      };
    }

    // Fallback: Armazenamento em Data URL para navegação/download imediato
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          nome: file.name,
          tipo: file.type || 'application/octet-stream',
        });
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado.'));
      reader.readAsDataURL(file);
    });
  },
};
