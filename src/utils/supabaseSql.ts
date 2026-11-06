export const SUPABASE_SQL_SCRIPT = `-- ========================================================
-- IONCLER EXCLUSIVE GESTOR DE IMÓVEIS - SCRIPT SUPABASE
-- ========================================================
-- Execute este script no SQL Editor do seu projeto Supabase
-- para criar as tabelas, índices, bucket e políticas de acesso.

-- 1. Criação da tabela de imóveis
CREATE TABLE IF NOT EXISTS public.imoveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    inquilino TEXT NOT NULL,
    proprietario TEXT NOT NULL,
    valor_aluguel NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    percentual_comissao NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    duracao_meses INTEGER NOT NULL DEFAULT 12,
    dia_vencimento INTEGER NOT NULL DEFAULT 10,
    contrato_url TEXT,
    contrato_nome TEXT,
    contrato_tipo TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Garante colunas caso a tabela já existisse
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS duracao_meses INTEGER DEFAULT 12;
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER DEFAULT 10;

-- 2. Criação da tabela de pagamentos / parcelas mensais
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
    mes_referencia VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    data_vencimento DATE NOT NULL,
    valor_aluguel NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    percentual_comissao NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    valor_comissao NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado')),
    data_pagamento DATE,
    observacao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_pagamentos_imovel_id ON public.pagamentos(imovel_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mes_ref ON public.pagamentos(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_vencimento ON public.pagamentos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_imoveis_status ON public.imoveis(status);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas públicas (anon) para uso aberto sem autenticação
-- (preparado para ser restrito a authenticated futuramente)

DROP POLICY IF EXISTS "Acesso total publico imoveis" ON public.imoveis;
CREATE POLICY "Acesso total publico imoveis"
ON public.imoveis
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total publico pagamentos" ON public.pagamentos;
CREATE POLICY "Acesso total publico pagamentos"
ON public.pagamentos
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Configuração do Supabase Storage para contratos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos', 'contratos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para o bucket 'contratos'
DROP POLICY IF EXISTS "Acesso publico download contratos" ON storage.objects;
CREATE POLICY "Acesso publico download contratos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'contratos');

DROP POLICY IF EXISTS "Acesso publico upload contratos" ON storage.objects;
CREATE POLICY "Acesso publico upload contratos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'contratos');

DROP POLICY IF EXISTS "Acesso publico update contratos" ON storage.objects;
CREATE POLICY "Acesso publico update contratos"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'contratos');

DROP POLICY IF EXISTS "Acesso publico delete contratos" ON storage.objects;
CREATE POLICY "Acesso publico delete contratos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'contratos');
`;
