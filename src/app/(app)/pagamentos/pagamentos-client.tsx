"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Pagamento } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PagamentoFormDialog } from "./pagamento-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { statusPagamentoColor } from "@/lib/status-styles";
import { toast } from "sonner";

const STATUS_FILTER = [
  "Todos",
  "Em dia",
  "Vencido",
  "Quitado",
  "Parcelado",
  "Aguardando entrada",
];

export function PagamentosClient() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pagamento | null>(null);
  const [deleting, setDeleting] = useState<Pagamento | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [pagRes, cliRes] = await Promise.all([
      supabase
        .from("pagamentos")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false }),
      supabase.from("clientes").select("*").order("nome"),
    ]);
    if (pagRes.data) setPagamentos(pagRes.data as unknown as Pagamento[]);
    if (cliRes.data) setClientes(cliRes.data as Cliente[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return pagamentos.filter((p) => statusFilter === "Todos" || p.status === statusFilter);
  }, [pagamentos, statusFilter]);

  const totalSaldoAberto = useMemo(() => {
    return pagamentos.reduce((sum, p) => sum + (p.valor_total - p.valor_pago), 0);
  }, [pagamentos]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("pagamentos").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (error) {
      toast.error("Erro ao excluir pagamento.");
      return;
    }
    toast.success("Pagamento excluído.");
    setDeleting(null);
    load();
  }

  return (
    <>
      <PageHeader
        title="Controle de Pagamentos"
        description="Acompanhe pagamentos e saldos devedores"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo pagamento
          </Button>
        }
      />

      <div className="rounded-lg border bg-card p-4 mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total em aberto</span>
        <span className="text-xl font-bold text-destructive">
          {formatCurrency(totalSaldoAberto)}
        </span>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            Nenhum pagamento encontrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const saldo = p.valor_total - p.valor_pago;
                return (
                  <TableRow
                    key={p.id}
                    className={
                      p.status === "Vencido"
                        ? "bg-destructive/5"
                        : p.status === "Quitado"
                        ? "bg-success/5"
                        : p.status === "Em dia"
                        ? "bg-warning/5"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {p.clientes?.nome ?? "-"}
                    </TableCell>
                    <TableCell>{p.servico || "-"}</TableCell>
                    <TableCell>{formatCurrency(p.valor_total)}</TableCell>
                    <TableCell>{formatCurrency(p.valor_pago)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(saldo)}</TableCell>
                    <TableCell>{formatDate(p.data_vencimento)}</TableCell>
                    <TableCell>
                      <Badge className={statusPagamentoColor[p.status]} variant="outline">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(p)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <PagamentoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pagamento={editing}
        clientes={clientes}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
        itemLabel={deleting?.servico ?? undefined}
        loading={deleteLoading}
      />
    </>
  );
}
