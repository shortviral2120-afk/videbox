"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Banco, Lancamento, TipoLancamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { LancamentoFormDialog } from "./lancamento-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const BANCOS: Banco[] = [
  "Nubank",
  "Bradesco",
  "Caixa",
  "Banco do Brasil",
  "Inter",
  "Dinheiro/Caixa Físico",
];

const BANCO_ICONS: Record<Banco, LucideIcon> = {
  Nubank: CreditCard,
  Bradesco: Landmark,
  Caixa: PiggyBank,
  "Banco do Brasil": Landmark,
  Inter: CreditCard,
  "Dinheiro/Caixa Físico": Banknote,
};

const TIPO_FILTER: ("Todos" | TipoLancamento)[] = ["Todos", "Entrada", "Saída"];

export function CaixaClient() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState<"Todos" | TipoLancamento>("Todos");
  const [bancoFilter, setBancoFilter] = useState<"Todos" | Banco>("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lancamento | null>(null);
  const [deleting, setDeleting] = useState<Lancamento | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("lancamentos")
      .select("*")
      .order("data", { ascending: false });
    if (data) setLancamentos(data as Lancamento[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const saldosPorBanco = useMemo(() => {
    const map = new Map<Banco, number>();
    for (const banco of BANCOS) map.set(banco, 0);
    for (const l of lancamentos) {
      const atual = map.get(l.banco) ?? 0;
      map.set(l.banco, atual + (l.tipo === "Entrada" ? l.valor : -l.valor));
    }
    return map;
  }, [lancamentos]);

  const totalConsolidado = useMemo(() => {
    let total = 0;
    for (const saldo of saldosPorBanco.values()) total += saldo;
    return total;
  }, [saldosPorBanco]);

  const filtered = useMemo(() => {
    return lancamentos.filter((l) => {
      if (tipoFilter !== "Todos" && l.tipo !== tipoFilter) return false;
      if (bancoFilter !== "Todos" && l.banco !== bancoFilter) return false;
      if (dataInicio && l.data < dataInicio) return false;
      if (dataFim && l.data > dataFim) return false;
      return true;
    });
  }, [lancamentos, tipoFilter, bancoFilter, dataInicio, dataFim]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("lancamentos").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (error) {
      toast.error("Erro ao excluir lançamento.");
      return;
    }
    toast.success("Lançamento excluído.");
    setDeleting(null);
    load();
  }

  return (
    <>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
        Saldos por banco
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {BANCOS.map((banco) => {
          const saldo = saldosPorBanco.get(banco) ?? 0;
          return (
            <StatCard
              key={banco}
              label={banco}
              value={formatCurrency(saldo)}
              icon={BANCO_ICONS[banco]}
              tone={saldo >= 0 ? "success" : "destructive"}
            />
          );
        })}
        <StatCard
          label="Total consolidado"
          value={formatCurrency(totalConsolidado)}
          icon={Wallet}
          tone={totalConsolidado >= 0 ? "success" : "destructive"}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Lançamentos</h2>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo lançamento
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as "Todos" | TipoLancamento)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPO_FILTER.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bancoFilter} onValueChange={(v) => setBancoFilter(v as "Todos" | Banco)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            {BANCOS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="sm:w-44"
          aria-label="Data início"
        />
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="sm:w-44"
          aria-label="Data fim"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento encontrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cliente/Fornecedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{formatDate(l.data)}</TableCell>
                  <TableCell>
                    <Badge variant={l.tipo === "Entrada" ? "success" : "destructive"}>
                      {l.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.banco}</TableCell>
                  <TableCell>{l.descricao || "-"}</TableCell>
                  <TableCell>{l.categoria || "-"}</TableCell>
                  <TableCell>{l.cliente_fornecedor || "-"}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(l.valor)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(l);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(l)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <LancamentoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lancamento={editing}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
        itemLabel={deleting?.descricao ?? undefined}
        loading={deleteLoading}
      />
    </>
  );
}
