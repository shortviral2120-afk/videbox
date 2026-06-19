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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ServicoItemFormDialog } from "@/app/(app)/servicos/[id]/servico-item-form-dialog";
import { GerarPdfButton } from "@/components/gerar-pdf-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { faseServicoColor } from "@/lib/status-styles";
import { loadPerfil } from "@/lib/perfil";
import { toast } from "sonner";

export function OrcamentoDetailClient({ id }: { id: string }) {
  const [servico, setServico] = useState<Servico | null>(null);
  const [itens, setItens] = useState<ServicoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);

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
    const perfil = loadPerfil();
    setPerfilIncompleto(!perfil.nomeEmpresa || !perfil.telefone || !perfil.cnpjCpf);
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

      {perfilIncompleto && (
        <Link
          href="/perfil"
          className="mb-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning hover:bg-warning/20 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Complete seu perfil para que o PDF saia com os dados da sua empresa. Clique aqui para
          preencher →
        </Link>
      )}

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
        <Button
          onClick={() => {
            setEditingItem(null);
            setItemFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Adicionar Item
        </Button>
        {servico.fase === "Orçamento" && (
          <Button
            className="bg-success text-success-foreground hover:bg-success/90"
            onClick={handleAprovar}
            disabled={approving}
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Aprovar Orçamento
          </Button>
        )}
        <GerarPdfButton servicoId={id} />
        <Button asChild variant="outline">
          <Link href={`/servicos/${id}`}>
            <ExternalLink className="h-4 w-4" />
            Ver Serviço
          </Link>
        </Button>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Largura aj. (m)</TableHead>
                <TableHead>Altura aj. (m)</TableHead>
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
                  <TableCell>{it.tipo_produto ?? "-"}</TableCell>
                  <TableCell className="font-medium">{it.descricao}</TableCell>
                  <TableCell>{it.material ?? "-"}</TableCell>
                  <TableCell>
                    {it.largura.toFixed(2)}
                    {it.largura_original != null && (
                      <span className="block text-xs text-muted-foreground">
                        orig. {it.largura_original.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {it.altura.toFixed(2)}
                    {it.altura_original != null && (
                      <span className="block text-xs text-muted-foreground">
                        orig. {it.altura_original.toFixed(2)}
                      </span>
                    )}
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
            <TableFooter>
              <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                <TableCell colSpan={8} className="text-right font-semibold">
                  Total geral
                </TableCell>
                <TableCell className="font-bold">{formatCurrency(totalGeral)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>

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
