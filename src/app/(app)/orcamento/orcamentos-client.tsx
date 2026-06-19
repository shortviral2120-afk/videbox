"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Servico } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { faseServicoColor } from "@/lib/status-styles";

const STATUS_FILTER = ["Todos", "Pendente", "Aprovado", "Concluído"] as const;

type StatusFilter = (typeof STATUS_FILTER)[number];

export function OrcamentosClient() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [itensTotalMap, setItensTotalMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [servRes, itensRes] = await Promise.all([
      supabase
        .from("servicos")
        .select("*, clientes(nome, telefone)")
        .order("created_at", { ascending: false }),
      supabase.from("servico_itens").select("servico_id, valor_total"),
    ]);

    if (servRes.data) setServicos(servRes.data as unknown as Servico[]);

    const map = new Map<string, number>();
    if (itensRes.data) {
      for (const row of itensRes.data as { servico_id: string; valor_total: number }[]) {
        map.set(row.servico_id, (map.get(row.servico_id) ?? 0) + row.valor_total);
      }
    }
    setItensTotalMap(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return servicos.filter((s) => {
      const term = search.toLowerCase();
      const matchesSearch =
        (s.clientes?.nome ?? "").toLowerCase().includes(term) ||
        s.titulo.toLowerCase().includes(term);

      let matchesStatus = true;
      if (statusFilter === "Pendente") matchesStatus = s.fase === "Orçamento";
      else if (statusFilter === "Concluído") matchesStatus = s.fase === "Concluído";
      else if (statusFilter === "Aprovado")
        matchesStatus = s.fase !== "Orçamento" && s.fase !== "Concluído";

      return matchesSearch && matchesStatus;
    });
  }, [servicos, search, statusFilter]);

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Acompanhe e aprove os orçamentos dos serviços"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Nenhum orçamento encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Link key={s.id} href={`/orcamento/${s.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-base">{s.clientes?.nome ?? "-"}</p>
                    <p className="text-sm text-muted-foreground">{s.titulo}</p>
                  </div>

                  <Badge className={faseServicoColor[s.fase]} variant="outline">
                    {s.fase}
                  </Badge>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor total</p>
                      <p className="font-medium">
                        {formatCurrency(itensTotalMap.get(s.id) ?? 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Data do orçamento</p>
                      <p>{formatDate(s.data_orcamento)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
