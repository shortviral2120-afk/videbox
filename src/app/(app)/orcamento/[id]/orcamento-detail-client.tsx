"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Servico, ServicoItem } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, CheckCircle2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { ServicoItemFormDialog } from "@/app/(app)/servicos/[id]/servico-item-form-dialog";
import { GerarPdfButton } from "@/components/gerar-pdf-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { faseServicoColor } from "@/lib/status-styles";
import { toast } from "sonner";

export function OrcamentoDetailClient({ id }: { id: string }) {
  const [servico, setServico] = useState<Servico | null>(null);
  const [itens, setItens] = useState<ServicoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServicoItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ServicoItem | null>(null);
  const [deletingItemLoading, setDeletingItemLoading] = useState(false);

  const [approving, setApproving] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [servRes, itensRes] = await Promise.all([
      supabase.from("servicos").select("*, clientes(nome, telefone)").eq("id", id).single(),
      supabase.from("servico_itens").select("*").eq("servico_id", id).order("created_at"),
    ]);

    setServico(servRes.data ? (servRes.data as unknown as Servico) : null);
    setItens(itensRes.data ? (itensRes.data as ServicoItem[]) : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function resyncValorTotal() {
    const supabase = createClient();
    const { data } = await supabase
      .from("servico_itens")
      .select("*")
      .eq("servico_id", id)
      .order("created_at");
    const freshItens = data ? (data as ServicoItem[]) : [];
    const total = freshItens.reduce((sum, it) => sum + it.valor_total, 0);
    await supabase
      .from("servicos")
      .update({ valor_total: total, updated_at: new Date().toISOString() })
      .eq("id", id);
    await load();
  }

  async function handleDeleteItem() {
    if (!deletingItem) return;
    setDeletingItemLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("servico_itens").delete().eq("id", deletingItem.id);
    setDeletingItemLoading(false);
    if (error) {
      toast.error("Erro ao excluir item.");
      return;
    }
    toast.success("Item excluído.");
    setDeletingItem(null);
    await resyncValorTotal();
  }

  async function handleAprovar() {
    if (!servico || servico.fase !== "Orçamento") return;
    setApproving(true);
    const total = itens.reduce((sum, it) => sum + it.valor_total, 0);
    const supabase = createClient();
    const { error } = await supabase
      .from("servicos")
      .update({ fase: "Aprovado", valor_total: total, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao aprovar orçamento.");
      setApproving(false);
      return;
    }
    await supabase.from("servico_fase_historico").insert({ servico_id: id, fase: "Aprovado" });
    toast.success("Orçamento aprovado!");
    setApproving(false);
    load();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!servico) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Orçamento não encontrado.
      </p>
    );
  }

  const totalGeral = itens.reduce((sum, it) => sum + it.valor_total, 0);
  const clienteNome = servico.clientes?.nome ?? "-";

  return (
    <>
      <Link
        href="/orcamento"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <PageHeader title={`${clienteNome} — ${servico.titulo}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-6">
        <div>
          <p className="text-xs text-muted-foreground">Cliente</p>
          <p>{clienteNome}</p>
        </div>
        {servico.clientes?.telefone && (
          <div>
            <p className="text-xs text-muted-foreground">Telefone</p>
            <p>{servico.clientes.telefone}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Data do orçamento</p>
          <p>{formatDate(servico.data_orcamento)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fase</p>
          <Badge className={faseServicoColor[servico.fase]} variant="outline">
            {servico.fase}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <GerarPdfButton servicoId={id} />
        <Button
          onClick={() => {
            setEditingItem(null);
            setItemFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Adicionar item
        </Button>
        {servico.fase === "Orçamento" && (
          <Button onClick={handleAprovar} disabled={approving}>
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Aprovar orçamento
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        {itens.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum item adicionado ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>L × A</TableHead>
                <TableHead>Área (m²)</TableHead>
                <TableHead>Preço/m²</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.descricao}</TableCell>
                  <TableCell>{it.material ?? "-"}</TableCell>
                  <TableCell>
                    {it.largura} × {it.altura}
                  </TableCell>
                  <TableCell>{it.area_m2.toFixed(2)}</TableCell>
                  <TableCell>{formatCurrency(it.preco_m2)}</TableCell>
                  <TableCell>{it.quantidade}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(it.valor_total)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingItem(it);
                        setItemFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingItem(it)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <p className="text-lg font-bold text-right">Total geral: {formatCurrency(totalGeral)}</p>

      <ServicoItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        servicoId={id}
        item={editingItem}
        onSaved={resyncValorTotal}
      />

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(o) => !o && setDeletingItem(null)}
        onConfirm={handleDeleteItem}
        itemLabel={deletingItem?.descricao}
        loading={deletingItemLoading}
      />
    </>
  );
}
