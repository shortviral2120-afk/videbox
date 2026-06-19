"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  Servico,
  ServicoItem,
  ServicoPagamento,
  ServicoFaseHistorico,
  FaseServico,
} from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { FaseTimeline } from "@/components/fase-timeline";
import { StatCard } from "@/components/stat-card";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  FileText,
  MessageCircle,
  Wallet,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import { ServicoEditDialog } from "./servico-edit-dialog";
import { ServicoItemFormDialog } from "./servico-item-form-dialog";
import { ServicoPagamentoFormDialog } from "./servico-pagamento-form-dialog";
import { GerarPdfButton } from "@/components/gerar-pdf-button";
import { loadPerfil } from "@/lib/perfil";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import {
  fasesServico,
  prioridadeColor,
  statusPagamentoServicoColor,
} from "@/lib/status-styles";
import { toast } from "sonner";

function buildWhatsAppUrl(
  telefone: string | null | undefined,
  saldoDevedor: number,
  clienteNome: string
): string {
  const digits = (telefone ?? "").replace(/\D/g, "");
  const phone = digits.length <= 11 ? `55${digits}` : digits;
  const text = encodeURIComponent(
    `Olá ${clienteNome}, tudo bem? Passando para lembrar que temos um saldo de ${formatCurrency(
      saldoDevedor
    )} em aberto. Podemos combinar o pagamento?`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export function ServicoDetailClient({ id }: { id: string }) {
  const [servico, setServico] = useState<Servico | null>(null);
  const [itens, setItens] = useState<ServicoItem[]>([]);
  const [pagamentos, setPagamentos] = useState<ServicoPagamento[]>([]);
  const [historico, setHistorico] = useState<ServicoFaseHistorico[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServicoItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ServicoItem | null>(null);
  const [deletingItemLoading, setDeletingItemLoading] = useState(false);

  const [pagamentoFormOpen, setPagamentoFormOpen] = useState(false);
  const [deletingPagamento, setDeletingPagamento] = useState<ServicoPagamento | null>(null);
  const [deletingPagamentoLoading, setDeletingPagamentoLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [servRes, itensRes, pagRes, histRes] = await Promise.all([
      supabase.from("servicos").select("*, clientes(nome, telefone)").eq("id", id).single(),
      supabase.from("servico_itens").select("*").eq("servico_id", id).order("created_at"),
      supabase
        .from("servico_pagamentos")
        .select("*")
        .eq("servico_id", id)
        .order("data_pagamento", { ascending: false }),
      supabase
        .from("servico_fase_historico")
        .select("*")
        .eq("servico_id", id)
        .order("changed_at", { ascending: false }),
    ]);

    setServico(servRes.data ? (servRes.data as unknown as Servico) : null);
    setItens(itensRes.data ? (itensRes.data as ServicoItem[]) : []);
    setPagamentos(pagRes.data ? (pagRes.data as ServicoPagamento[]) : []);
    setHistorico(histRes.data ? (histRes.data as ServicoFaseHistorico[]) : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function changeFase(novaFase: FaseServico) {
    const supabase = createClient();
    await supabase
      .from("servicos")
      .update({ fase: novaFase, updated_at: new Date().toISOString() })
      .eq("id", id);
    await supabase.from("servico_fase_historico").insert({ servico_id: id, fase: novaFase });

    if (novaFase === "Concluído" && servico) {
      try {
        const { data: existente } = await supabase
          .from("lancamentos")
          .select("id")
          .eq("servico_id", id)
          .eq("categoria", "Pagamento recebido")
          .eq("descricao", `Serviço concluído: ${servico.titulo}`)
          .maybeSingle();
        if (!existente && servico.saldo_devedor > 0) {
          const { error: lancError } = await supabase.from("lancamentos").insert({
            data: new Date().toISOString().slice(0, 10),
            tipo: "Entrada",
            categoria: "Pagamento recebido",
            categoria_tipo: "Empresa",
            descricao: `Serviço concluído: ${servico.titulo}`,
            valor: servico.saldo_devedor,
            servico_id: id,
            banco_id: null,
          });
          if (lancError) throw lancError;
          toast.success(
            `Serviço concluído! Lançamento de ${formatCurrency(servico.saldo_devedor)} criado no Financeiro.`
          );
        } else {
          toast.success("Fase atualizada!");
        }
      } catch {
        toast.error("Serviço concluído, mas houve erro ao criar o lançamento no Financeiro.");
      }
    } else {
      toast.success("Fase atualizada!");
    }

    load();
  }

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

  async function handleDeletePagamento() {
    if (!deletingPagamento || !servico) return;
    setDeletingPagamentoLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("servico_pagamentos")
      .delete()
      .eq("id", deletingPagamento.id);
    if (error) {
      setDeletingPagamentoLoading(false);
      toast.error("Erro ao excluir pagamento.");
      return;
    }
    const novoValorEntrada = Math.max(0, servico.valor_entrada - deletingPagamento.valor);
    const novoStatus =
      novoValorEntrada <= 0
        ? "Aguardando entrada"
        : novoValorEntrada < servico.valor_total
        ? "Entrada recebida"
        : "Quitado";
    await supabase
      .from("servicos")
      .update({
        valor_entrada: novoValorEntrada,
        status_pagamento: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setDeletingPagamentoLoading(false);
    toast.success("Pagamento excluído.");
    setDeletingPagamento(null);
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
    return <p className="p-8 text-center text-sm text-muted-foreground">Serviço não encontrado.</p>;
  }

  const currentIndex = fasesServico.indexOf(servico.fase);
  const totalOrcamento = itens.reduce((sum, it) => sum + it.valor_total, 0);
  const clienteNome = servico.clientes?.nome ?? "-";
  const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);
  const saldoDevedor = servico.valor_total - totalPago;
  const progressoPagamento =
    servico.valor_total > 0 ? Math.min(100, (totalPago / servico.valor_total) * 100) : 0;
  const percentualEntradaSugerido = loadPerfil().percentualEntrada;

  return (
    <>
      <Link
        href="/servicos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <PageHeader title={`${clienteNome} — ${servico.titulo}`} />

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <FaseTimeline fase={servico.fase} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => changeFase(fasesServico[currentIndex - 1])}
              >
                Voltar fase
              </Button>
              <Button
                size="sm"
                disabled={currentIndex === fasesServico.length - 1}
                onClick={() => changeFase(fasesServico[currentIndex + 1])}
              >
                Avançar fase
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} className="ml-auto">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Prioridade</p>
              <Badge className={prioridadeColor[servico.prioridade]} variant="outline">
                {servico.prioridade}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data do orçamento</p>
              <p>{formatDate(servico.data_orcamento)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data de instalação</p>
              <p>{formatDate(servico.data_instalacao)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fornecedor do material</p>
              <p>{servico.fornecedor_material ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Material chegou</p>
              {servico.material_chegou ? (
                <Badge variant="outline">{servico.material_chegou}</Badge>
              ) : (
                <p>-</p>
              )}
            </div>
            {servico.observacoes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="whitespace-pre-wrap">{servico.observacoes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orcamento" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href={`/orcamento/${id}`}>
                <FileText className="h-4 w-4" />
                Ver orçamento completo
              </Link>
            </Button>
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

          <p className="text-sm font-medium text-right">
            Total do orçamento: {formatCurrency(totalOrcamento)}
          </p>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          {servico.valor_total === 0 && (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              Finalize o orçamento primeiro para definir o valor total.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Valor total" value={formatCurrency(servico.valor_total)} icon={CircleDollarSign} />
            <StatCard label="Total pago" value={formatCurrency(totalPago)} icon={Wallet} tone="success" />
            <StatCard
              label="Saldo devedor"
              value={formatCurrency(saldoDevedor)}
              icon={AlertCircle}
              tone={saldoDevedor > 0 ? "destructive" : "success"}
            />
          </div>

          <Progress value={progressoPagamento} />

          <p className="text-xs text-muted-foreground">
            Entrada sugerida ({percentualEntradaSugerido}%):{" "}
            {formatCurrency((servico.valor_total * percentualEntradaSugerido) / 100)}
          </p>

          {isOverdue(servico.data_vencimento_saldo) && saldoDevedor > 0 && (
            <Badge variant="destructive">Vencido em {formatDate(servico.data_vencimento_saldo)}</Badge>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={() => setPagamentoFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Registrar pagamento
            </Button>
            {servico.clientes?.telefone && (
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={() =>
                  window.open(
                    buildWhatsAppUrl(servico.clientes?.telefone, saldoDevedor, clienteNome),
                    "_blank"
                  )
                }
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            )}
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            {pagamentos.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum pagamento registrado ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.data_pagamento)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(p.valor)}</TableCell>
                      <TableCell>{p.forma ?? "-"}</TableCell>
                      <TableCell>{p.observacao ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setDeletingPagamento(p)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <Badge className={statusPagamentoServicoColor[servico.status_pagamento]} variant="outline">
              {servico.status_pagamento}
            </Badge>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          {historico.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma mudança de fase registrada ainda.
            </p>
          ) : (
            <ul className="space-y-3">
              {historico.map((h) => (
                <li key={h.id} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{formatDate(h.changed_at)}</span>
                  <span className="font-medium">{h.fase}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <ServicoEditDialog open={editOpen} onOpenChange={setEditOpen} servico={servico} onSaved={load} />

      <ServicoItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        servicoId={id}
        item={editingItem}
        onSaved={resyncValorTotal}
      />

      <ServicoPagamentoFormDialog
        open={pagamentoFormOpen}
        onOpenChange={setPagamentoFormOpen}
        servico={servico}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(o) => !o && setDeletingItem(null)}
        onConfirm={handleDeleteItem}
        itemLabel={deletingItem?.descricao}
        loading={deletingItemLoading}
      />

      <ConfirmDeleteDialog
        open={!!deletingPagamento}
        onOpenChange={(o) => !o && setDeletingPagamento(null)}
        onConfirm={handleDeletePagamento}
        itemLabel={deletingPagamento ? formatCurrency(deletingPagamento.valor) : undefined}
        loading={deletingPagamentoLoading}
      />
    </>
  );
}
