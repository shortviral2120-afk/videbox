"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { faseServicoColor } from "@/lib/status-styles";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Cliente, Servico, ServicoPagamento } from "@/lib/types";
import { CircleDollarSign, Wallet, AlertCircle } from "lucide-react";

export function ClienteDetailClient({ id }: { id: string }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pagamentos, setPagamentos] = useState<ServicoPagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    const supabase = createClient();

    const { data: clienteData } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single();

    const { data: servicosData } = await supabase
      .from("servicos")
      .select("*")
      .eq("cliente_id", id)
      .order("created_at", { ascending: false });

    const servicoIds = (servicosData ?? []).map((s) => s.id);

    let pagamentosData: ServicoPagamento[] = [];
    if (servicoIds.length > 0) {
      const { data } = await supabase
        .from("servico_pagamentos")
        .select("*")
        .in("servico_id", servicoIds);
      pagamentosData = data ?? [];
    }

    setCliente(clienteData ?? null);
    setServicos(servicosData ?? []);
    setPagamentos(pagamentosData);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return <p className="text-sm text-muted-foreground">Cliente não encontrado.</p>;
  }

  const totalFaturado = servicos.reduce((acc, s) => acc + (s.valor_total ?? 0), 0);
  const totalRecebido = pagamentos.reduce((acc, p) => acc + (p.valor ?? 0), 0);
  const totalAberto = servicos.reduce((acc, s) => acc + (s.saldo_devedor ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="text-sm text-muted-foreground hover:underline">
        ← Voltar
      </Link>

      <PageHeader title={cliente.nome} description={cliente.telefone ?? "Sem telefone"} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total faturado"
          value={formatCurrency(totalFaturado)}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Total recebido"
          value={formatCurrency(totalRecebido)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Total em aberto"
          value={formatCurrency(totalAberto)}
          icon={AlertCircle}
          tone={totalAberto > 0 ? "destructive" : "default"}
        />
      </div>

      <div>
        <h2 className="font-semibold mb-3">Serviços</h2>
        {servicos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum serviço cadastrado para este cliente.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Valor total</TableHead>
                <TableHead>Saldo devedor</TableHead>
                <TableHead>Instalação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((s) => (
                <TableRow key={s.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/servicos/${s.id}`} className="hover:underline">
                      {s.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={faseServicoColor[s.fase]} variant="outline">
                      {s.fase}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(s.valor_total)}</TableCell>
                  <TableCell
                    className={cn(s.saldo_devedor > 0 && "text-destructive")}
                  >
                    {formatCurrency(s.saldo_devedor)}
                  </TableCell>
                  <TableCell>{formatDate(s.data_instalacao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
