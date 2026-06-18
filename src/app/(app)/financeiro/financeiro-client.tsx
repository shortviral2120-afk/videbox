"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BancoConta, CategoriaBanco, Lancamento, Servico, TipoLancamento } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BancoFormDialog } from "./banco-form-dialog";
import { LancamentoFormDialog } from "./lancamento-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const TIPO_FILTER: ("Todos" | TipoLancamento)[] = ["Todos", "Entrada", "Saída"];
const CATEGORIA_TIPO_FILTER: ("Todos" | CategoriaBanco)[] = ["Todos", "Empresa", "Pessoal"];

const PIE_COLORS = ["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];

export function FinanceiroClient() {
  const [bancos, setBancos] = useState<BancoConta[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const [tipoFilter, setTipoFilter] = useState<"Todos" | TipoLancamento>("Todos");
  const [bancoFilter, setBancoFilter] = useState<string>("Todos");
  const [categoriaTipoFilter, setCategoriaTipoFilter] = useState<"Todos" | CategoriaBanco>(
    "Todos"
  );
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [bancoFormOpen, setBancoFormOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<BancoConta | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lancamento | null>(null);
  const [deleting, setDeleting] = useState<Lancamento | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [bancosRes, lancamentosRes, servicosRes] = await Promise.all([
      supabase.from("bancos").select("*").order("nome"),
      supabase
        .from("lancamentos")
        .select("*, bancos(nome)")
        .order("data", { ascending: false }),
      supabase.from("servicos").select("id, titulo"),
    ]);
    if (bancosRes.data) setBancos(bancosRes.data as BancoConta[]);
    if (lancamentosRes.data) setLancamentos(lancamentosRes.data as unknown as Lancamento[]);
    if (servicosRes.data) setServicos(servicosRes.data as unknown as Servico[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const saldosPorBanco = useMemo(() => {
    const map = new Map<string, number>();
    for (const banco of bancos) map.set(banco.id, banco.saldo_inicial);
    for (const l of lancamentos) {
      if (!l.banco_id) continue;
      const atual = map.get(l.banco_id) ?? 0;
      map.set(l.banco_id, atual + (l.tipo === "Entrada" ? l.valor : -l.valor));
    }
    return map;
  }, [bancos, lancamentos]);

  const bancosAtivos = useMemo(() => bancos.filter((b) => b.ativo === true), [bancos]);

  const totalEmpresa = useMemo(() => {
    return bancosAtivos
      .filter((b) => b.categoria === "Empresa")
      .reduce((sum, b) => sum + (saldosPorBanco.get(b.id) ?? 0), 0);
  }, [bancosAtivos, saldosPorBanco]);

  const totalPessoal = useMemo(() => {
    return bancosAtivos
      .filter((b) => b.categoria === "Pessoal")
      .reduce((sum, b) => sum + (saldosPorBanco.get(b.id) ?? 0), 0);
  }, [bancosAtivos, saldosPorBanco]);

  const totalGeral = totalEmpresa + totalPessoal;

  const filtered = useMemo(() => {
    return lancamentos.filter((l) => {
      if (tipoFilter !== "Todos" && l.tipo !== tipoFilter) return false;
      if (bancoFilter !== "Todos" && l.banco_id !== bancoFilter) return false;
      if (categoriaTipoFilter !== "Todos" && l.categoria_tipo !== categoriaTipoFilter)
        return false;
      if (dataInicio && l.data < dataInicio) return false;
      if (dataFim && l.data > dataFim) return false;
      return true;
    });
  }, [lancamentos, tipoFilter, bancoFilter, categoriaTipoFilter, dataInicio, dataFim]);

  const resumoMes = useMemo(() => {
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth();
    const doMes = lancamentos.filter((l) => {
      const d = new Date(l.data + "T00:00:00");
      return d.getFullYear() === ano && d.getMonth() === mes;
    });
    const entradas = doMes
      .filter((l) => l.tipo === "Entrada")
      .reduce((sum, l) => sum + l.valor, 0);
    const saidas = doMes.filter((l) => l.tipo === "Saída").reduce((sum, l) => sum + l.valor, 0);
    const porCategoria = new Map<string, number>();
    for (const l of doMes) {
      if (l.tipo !== "Saída") continue;
      const cat = l.categoria ?? "Outros";
      porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + l.valor);
    }
    const pieData = Array.from(porCategoria.entries()).map(([name, value]) => ({ name, value }));
    return { entradas, saidas, resultado: entradas - saidas, pieData };
  }, [lancamentos]);

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

  if (loading) {
    return (
      <>
        <PageHeader title="Financeiro" description="Controle de entradas, saídas e saldos por conta" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Controle de entradas, saídas e saldos por conta"
      />

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold mb-3">Meus Bancos</h2>
        <Button
          onClick={() => {
            setEditingBanco(null);
            setBancoFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Adicionar banco
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {bancosAtivos.map((banco) => {
          const saldo = saldosPorBanco.get(banco.id) ?? 0;
          return (
            <button
              key={banco.id}
              type="button"
              className="text-left w-full"
              onClick={() => {
                setEditingBanco(banco);
                setBancoFormOpen(true);
              }}
            >
              <StatCard
                label={`${banco.nome} (${banco.tipo})`}
                value={formatCurrency(saldo)}
                icon={Wallet}
                tone={saldo >= 0 ? "success" : "destructive"}
              />
            </button>
          );
        })}
        <StatCard
          label="Total Empresa"
          value={formatCurrency(totalEmpresa)}
          icon={Wallet}
          tone={totalEmpresa >= 0 ? "success" : "destructive"}
        />
        <StatCard
          label="Total Pessoal"
          value={formatCurrency(totalPessoal)}
          icon={Wallet}
          tone={totalPessoal >= 0 ? "success" : "destructive"}
        />
        <StatCard
          label="Total Geral"
          value={formatCurrency(totalGeral)}
          icon={Wallet}
          tone={totalGeral >= 0 ? "success" : "destructive"}
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

        <Select value={bancoFilter} onValueChange={setBancoFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            {bancos.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoriaTipoFilter}
          onValueChange={(v) => setCategoriaTipoFilter(v as "Todos" | CategoriaBanco)}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIA_TIPO_FILTER.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
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

      <div className="rounded-lg border bg-card overflow-x-auto mb-6">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento encontrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Empresa/Pessoal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{formatDate(l.data)}</TableCell>
                  <TableCell>{l.descricao || "-"}</TableCell>
                  <TableCell>{l.bancos?.nome ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.categoria_tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.tipo === "Entrada" ? "success" : "destructive"}>
                      {l.tipo}
                    </Badge>
                  </TableCell>
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

      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
        Resumo do Mês
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Entradas"
          value={formatCurrency(resumoMes.entradas)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Saídas"
          value={formatCurrency(resumoMes.saidas)}
          icon={Wallet}
          tone="destructive"
        />
        <StatCard
          label="Resultado líquido"
          value={formatCurrency(resumoMes.resultado)}
          icon={Wallet}
          tone={resumoMes.resultado >= 0 ? "success" : "destructive"}
        />
      </div>

      <div className="rounded-lg border bg-card p-4 mb-6">
        {resumoMes.pieData.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma saída registrada neste mês.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={resumoMes.pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
              >
                {resumoMes.pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <BancoFormDialog
        open={bancoFormOpen}
        onOpenChange={setBancoFormOpen}
        banco={editingBanco}
        onSaved={load}
      />

      <LancamentoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lancamento={editing}
        bancos={bancos}
        servicos={servicos}
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
