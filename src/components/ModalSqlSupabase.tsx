import React, { useState } from 'react';
import { X, Copy, Check, Database, ShieldCheck, HardDrive, Key, ExternalLink } from 'lucide-react';
import { SUPABASE_SQL_SCRIPT } from '../utils/supabaseSql';
import { isSupabaseConfigured } from '../lib/supabase';

interface ModalSqlSupabaseProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalSqlSupabase: React.FC<ModalSqlSupabaseProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const isConfigured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Conexão com o Supabase
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${isConfigured ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                  {isConfigured ? 'Conectado ao Supabase' : 'Armazenamento Local Ativo'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Script SQL pronto para criação de tabelas, índices, bucket de contratos e chaves de acesso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700 flex-1">
          {/* Instruções de Passo a Passo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold mb-1 text-xs uppercase tracking-wider text-red-600">
                <Database className="w-4 h-4" /> 1. SQL Editor
              </div>
              <p className="text-xs text-slate-600">
                No seu projeto no <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-red-600 underline font-semibold inline-flex items-center gap-0.5">Supabase <ExternalLink className="w-2.5 h-2.5" /></a>, abra o <strong>SQL Editor</strong> e execute o script abaixo.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold mb-1 text-xs uppercase tracking-wider text-red-600">
                <HardDrive className="w-4 h-4" /> 2. Bucket Contratos
              </div>
              <p className="text-xs text-slate-600">
                O script cria automaticamente o bucket público <strong>contratos</strong> com upload e download liberados.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold mb-1 text-xs uppercase tracking-wider text-red-600">
                <ShieldCheck className="w-4 h-4" /> 3. Políticas RLS
              </div>
              <p className="text-xs text-slate-600">
                Políticas permissivas para uso direto sem login e preparadas para autenticação com e-mail e senha no futuro.
              </p>
            </div>
          </div>

          {/* Configuração de Variáveis de Ambiente */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
              <Key className="w-4 h-4 text-red-600" /> Variáveis no arquivo <code className="text-red-600 bg-white border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">.env</code> (ou nas Environment Variables da Vercel)
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto select-all">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica`}
            </pre>
            <p className="text-[11px] text-slate-500">
              Copie o <strong>Project URL</strong> e a <strong>anon public key</strong> em <em>Project Settings &gt; API</em> no painel do Supabase.
            </p>
          </div>

          {/* Área do Script SQL com botão Copiar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                Script SQL Completo (PostgreSQL / Supabase)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copiado com sucesso!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar Código SQL
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono max-h-64 overflow-y-auto leading-relaxed select-all">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Ioncler Exclusive Gestor de Imóveis • CRECI-PA 13.175
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
