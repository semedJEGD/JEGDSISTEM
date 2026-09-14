'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/escola/login?tab=admin');
  }, [router]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center text-xs text-[#68756E]">
      Redirecionando para o Portal de Acesso Unificado...
    </div>
  );
}
