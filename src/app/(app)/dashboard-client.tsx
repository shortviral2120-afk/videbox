"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Servico, ServicoPagamento } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Wrench, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { fasesServico } from "@/lib/status-styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pagamentos, setPagamentos] = useState<ServicoPagamento[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [cliRes, servRes, pagRes] = await Promise.all([
        supabase.from("clientes").select("*"),
        supabase.from("servicos").select("*, clientes(nome)"),
        supabase.from("servico_pagamentos").select("*"),
      ]);
      if (cliRes.data) setClientes(cliRes.data as Cliente[]);
      if (servRes.data) setServicos(servRes.data as unknown as Servico[]);
      if (pagRes.data) setPagamentos(pagRes.data as ServicoPagamento[]);
      setLoading(false);
    }
    load();
  }, []);

  const servicosAtivos = useMemo(
    () => servicos.filter((s) => s.fase !== "Concluído").length,
    [servicos]
  );

  const receitaMesAtual = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return pagamentos
      .filter((p) => {
        const d = new Date(p.data_pagamento);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.valor, 0);
  }, [pagamentos]);

  const aReceber = useMemo(
    () => servicos.reduce((sum, s) => sum + (s.saldo_devedor ?? 0), 0),
    [servicos]
  );

  const concluidosMes = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return servicos.filter((s) => {
      if (s.fase !== "Concluído") return false;
      const d = new Date(s.updated_at);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
  }, [servicos]);

  const receitaMensal = useMemo(() => {
    const now = new Date();
    const months: { month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return months.map(({ month, year }) => {
      const recebido = pagamentos
        .filter((p) => {
          const d = new Date(p.data_pagamento);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, p) => sum + p.valor, 0);
      const concluidos = servicos
        .filter((s) => {
          if (s.fase !== "Concluído") return false;
          const d = new Date(s.updated_at);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, s) => sum + s.valor_total, 0);
      const label = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "short" });
      return { label, recebido, concluidos };
    });
  }, [pagamentos, servicos]);

  const cobrancasVencidas = useMemo(
    () => servicos.filter((s) => s.saldo_devedor > 0 && isOverdue(s.data_vencimento_saldo)),
    [servicos]
  );

  const instalacoesHoje = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return servicos.filter((s) => s.data_instalacao === today);
  }, [servicos]);

  const materialACaminho = useMemo(
    () =>
      servicos.filter(
        (s) =>
          s.material_chegou === "A caminho" &&
          Date.now() - new Date(s.updated_at).getTime() > 7 * 24 * 60 * 60 * 1000
      ),
    [servicos]
  );

  const semAlertas =
    cobrancasVencidas.length === 0 && instalacoesHoje.length === 0 && materialACaminho.length === 0;

  const faseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    fasesServico.forEach((f) => (counts[f] = 0));
    servicos.forEach((s) => {
      counts[s.fase] = (counts[s.fase] ?? 0) + 1;
    });
    return counts;
  }, [servicos]);

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
        <StatCard label="Serviços ativos" value={String(servicosAtivos)} icon={Wrench} />
        <StatCard
          label="Receita do mês"
          value={formatCurrency(receitaMesAtual)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="A receber"
          value={formatCurrency(aReceber)}
          icon={AlertTriangle}
          tone="destructive"
        />
        <StatCard
          label="Concluídos no mês"
          value={String(concluidosMes)}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="rounded-lg border bg-card p-4 mb-6">
        <h2 className="font-semibold mb-3">Receita mensal</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={receitaMensal}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="recebido" name="Recebido" fill="hsl(var(--primary))" />
            <Bar dataKey="concluidos" name="Total concluído" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-3">Alertas</h2>
          {semAlertas ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento. 🎉</p>
          ) : (
            <div className="space-y-4">
              {cobrancasVencidas.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Cobranças vencidas
                  </p>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {cobrancasVencidas.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{s.clientes?.nome ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            Venceu em {formatDate(s.data_vencimento_saldo)}
                          </p>
                        </div>
                        <span className="font-semibold text-destructive">
                          {formatCurrency(s.saldo_devedor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {instalacoesHoje.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Instalações hoje
                  </p>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {instalacoesHoje.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{s.clientes?.nome ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">{s.titulo}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {materialACaminho.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Material a caminho há mais de 7 dias
                  </p>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {materialACaminho.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{s.clientes?.nome ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">{s.titulo}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <Link href="/servicos" className="mt-3 inline-block text-sm text-primary hover:underline">
            Ver todos os serviços →
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-3">Resumo por fase</h2>
          <div className="space-y-2">
            {fasesServico.map((fase) => (
              <div key={fase} className="flex items-center justify-between text-sm">
                <span>{fase}</span>
                <Badge variant="secondary">{faseCounts[fase] ?? 0}</Badge>
              </div>
            ))}
          </div>
          <Link href="/servicos" className="mt-3 inline-block text-sm text-primary hover:underline">
            Ver todos os serviços →
          </Link>
        </div>
      </div>
    </>
  );
}
