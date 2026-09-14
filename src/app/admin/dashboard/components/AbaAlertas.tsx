'use client';

import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export interface AlertaInconsistencia {
  tipo: string;
  mensagem: string;
  escolaNome: string;
  atletaNome?: string;
}

interface AbaAlertasProps {
  alertas: AlertaInconsistencia[];
}

export function AbaAlertas({ alertas }: AbaAlertasProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 space-y-2 shadow-sm">
        <h3 className="text-base font-bold text-[#17221D] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Auditoria e Alertas de Inconsistências</span>
        </h3>
        <p className="text-xs text-[#68756E]">
          O sistema verifica automaticamente documentos faltantes, termos pendentes e cadastros que requerem atenção da comissão.
        </p>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center text-xs text-[#087A5B] font-bold shadow-sm">
          ✓ Nenhuma inconsistência encontrada no momento. Todos os atletas cadastrados possuem documentação completa.
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta, idx) => (
            <div key={idx} className="bg-white border border-red-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#17221D]">{alerta.atletaNome}</span>
                  <span className="text-[#68756E]">({alerta.escolaNome})</span>
                </div>
                <p className="text-red-700">{alerta.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
