"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Cronograma, Pagamento } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Wrench, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { fasesCronograma } from "@/lib/status-styles";
import Link from "next/link";

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [cronograma, setCronograma] = useState<Cronograma[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [cliRes, pagRes, croRes] = await Promise.all([
        supabase.from("clientes").select("*"),
        supabase.from("pagamentos").select("*, clientes(nome)"),
        supabase.from("cronograma").select("*, clientes(nome)"),
      ]);
      if (cliRes.data) setClientes(cliRes.data as Cliente[]);
      if (pagRes.data) setPagamentos(pagRes.data as unknown as Pagamento[]);
      if (croRes.data) setCronograma(croRes.data as unknown as Cronograma[]);
      setLoading(false);
    }
    load();
  }, []);

  const clientesAtivos = useMemo(
    () => clientes.filter((c) => c.status !== "Concluído" && c.status !== "Cancelado").length,
    [clientes]
  );

  const valorEmAberto = useMemo(
    () => pagamentos.reduce((sum, p) => sum + (p.valor_total - p.valor_pago), 0),
    [pagamentos]
  );

  const servicosEmAndamento = useMemo(
    () => cronograma.filter((c) => c.fase !== "Concluído").length,
    [cronograma]
  );

  const receitaMesAtual = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return pagamentos
      .filter((p) => {
        const d = new Date(p.created_at);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.valor_pago, 0);
  }, [pagamentos]);

  const vencidos = useMemo(
    () =>
      pagamentos.filter(
        (p) => p.status !== "Quitado" && isOverdue(p.data_vencimento)
      ),
    [pagamentos]
  );

  const faseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    fasesCronograma.forEach((f) => (counts[f] = 0));
    cronograma.forEach((c) => {
      counts[c.fase] = (counts[c.fase] ?? 0) + 1;
    });
    return counts;
  }, [cronograma]);

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Visão geral da vidraçaria" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral da vidraçaria" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Clientes ativos" value={String(clientesAtivos)} icon={Users} />
        <StatCard
          label="Valor em aberto"
          value={formatCurrency(valorEmAberto)}
          icon={AlertTriangle}
          tone="destructive"
        />
        <StatCard
          label="Serviços em andamento"
          value={String(servicosEmAndamento)}
          icon={Wrench}
          tone="warning"
        />
        <StatCard
          label="Receita do mês"
          value={formatCurrency(receitaMesAtual)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-3">Pagamentos vencidos</h2>
          {vencidos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento vencido. 🎉</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {vencidos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.clientes?.nome ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      Venceu em {formatDate(p.data_vencimento)}
                    </p>
                  </div>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(p.valor_total - p.valor_pago)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/pagamentos"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Ver todos os pagamentos →
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-3">Resumo por fase</h2>
          <div className="space-y-2">
            {fasesCronograma.map((fase) => (
              <div key={fase} className="flex items-center justify-between text-sm">
                <span>{fase}</span>
                <Badge variant="secondary">{faseCounts[fase] ?? 0}</Badge>
              </div>
            ))}
          </div>
          <Link
            href="/cronograma"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Ver cronograma completo →
          </Link>
        </div>
      </div>
    </>
  );
}
