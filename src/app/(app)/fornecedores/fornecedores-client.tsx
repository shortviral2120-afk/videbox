"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Fornecedor, FornecedorContato, PrecoMaterial } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Star, MessageCircle } from "lucide-react";
import { FornecedorFormDialog } from "./fornecedor-form-dialog";
import { PrecoFormDialog } from "./preco-form-dialog";
import { ContatoFormDialog } from "./contato-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import { toast } from "sonner";

function buildWhatsAppLink(telefone: string | null): string {
  const digits = (telefone ?? "").replace(/\D/g, "");
  const phone = digits.length <= 11 ? `55${digits}` : digits;
  return `https://api.whatsapp.com/send?phone=${phone}`;
}

function RatingStars({ rating }: { rating: number | null }) {
  const value = rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= value ? "h-3.5 w-3.5 fill-yellow-400 text-yellow-400" : "h-3.5 w-3.5 text-muted-foreground"
          }
        />
      ))}
    </div>
  );
}

export function FornecedoresClient() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [precos, setPrecos] = useState<PrecoMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const [fornecedorFormOpen, setFornecedorFormOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deletingFornecedor, setDeletingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteFornecedorLoading, setDeleteFornecedorLoading] = useState(false);

  const [precoFormOpen, setPrecoFormOpen] = useState(false);
  const [editingPreco, setEditingPreco] = useState<PrecoMaterial | null>(null);
  const [deletingPreco, setDeletingPreco] = useState<PrecoMaterial | null>(null);
  const [deletePrecoLoading, setDeletePrecoLoading] = useState(false);

  const [contatos, setContatos] = useState<FornecedorContato[]>([]);
  const [contatoFormOpen, setContatoFormOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<FornecedorContato | null>(null);
  const [deletingContato, setDeletingContato] = useState<FornecedorContato | null>(null);
  const [deleteContatoLoading, setDeleteContatoLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [forRes, precoRes, contatoRes] = await Promise.all([
      supabase.from("fornecedores").select("*").order("nome"),
      supabase
        .from("precos_materiais")
        .select("*, fornecedores(nome)")
        .order("created_at", { ascending: false }),
      supabase
        .from("fornecedor_contatos")
        .select("*, fornecedores(nome)")
        .order("created_at", { ascending: false }),
    ]);
    if (forRes.data) setFornecedores(forRes.data as Fornecedor[]);
    if (precoRes.data) setPrecos(precoRes.data as unknown as PrecoMaterial[]);
    if (contatoRes.data) setContatos(contatoRes.data as unknown as FornecedorContato[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeleteFornecedor() {
    if (!deletingFornecedor) return;
    setDeleteFornecedorLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("fornecedores")
      .delete()
      .eq("id", deletingFornecedor.id);
    setDeleteFornecedorLoading(false);
    if (error) {
      toast.error("Erro ao excluir fornecedor.");
      return;
    }
    toast.success("Fornecedor excluído.");
    setDeletingFornecedor(null);
    load();
  }

  async function handleDeletePreco() {
    if (!deletingPreco) return;
    setDeletePrecoLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("precos_materiais")
      .delete()
      .eq("id", deletingPreco.id);
    setDeletePrecoLoading(false);
    if (error) {
      toast.error("Erro ao excluir preço.");
      return;
    }
    toast.success("Preço excluído.");
    setDeletingPreco(null);
    load();
  }

  async function handleDeleteContato() {
    if (!deletingContato) return;
    setDeleteContatoLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("fornecedor_contatos")
      .delete()
      .eq("id", deletingContato.id);
    setDeleteContatoLoading(false);
    if (error) {
      toast.error("Erro ao excluir contato.");
      return;
    }
    toast.success("Contato excluído.");
    setDeletingContato(null);
    load();
  }

  return (
    <>
      <PageHeader
        title="Fornecedores"
        description="Gerencie fornecedores e a tabela de preços de materiais"
      />

      <Tabs defaultValue="fornecedores">
        <TabsList>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="precos">Tabela de preços</TabsTrigger>
          <TabsTrigger value="contatos">Contatos</TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingFornecedor(null);
                setFornecedorFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo fornecedor
            </Button>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : fornecedores.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum fornecedor encontrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Produto principal</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell>
                        {f.contato || "-"}
                        {f.telefone ? ` · ${f.telefone}` : ""}
                      </TableCell>
                      <TableCell>{f.produto_principal || "-"}</TableCell>
                      <TableCell>
                        {f.prazo_entrega != null ? `${f.prazo_entrega} dias` : "-"}
                      </TableCell>
                      <TableCell>{f.forma_pagamento || "-"}</TableCell>
                      <TableCell>
                        <RatingStars rating={f.avaliacao} />
                      </TableCell>
                      <TableCell>
                        {f.ativo ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingFornecedor(f);
                            setFornecedorFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingFornecedor(f)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="precos">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingPreco(null);
                setPrecoFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo preço
            </Button>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : precos.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum preço encontrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Espessura/tipo</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Preço/m²</TableHead>
                    <TableHead>Cotação</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {precos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.material}</TableCell>
                      <TableCell>{p.espessura_tipo || "-"}</TableCell>
                      <TableCell>{p.fornecedores?.nome ?? "-"}</TableCell>
                      <TableCell>{formatCurrency(p.preco_m2)}</TableCell>
                      <TableCell>{formatDate(p.data_cotacao)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatDate(p.validade)}
                          {isOverdue(p.validade) && (
                            <Badge variant="destructive">Vencido</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPreco(p);
                            setPrecoFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingPreco(p)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contatos">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingContato(null);
                setContatoFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo contato
            </Button>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : contatos.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum contato cadastrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contatos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.fornecedores?.nome ?? "-"}</TableCell>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell>{c.cargo || "-"}</TableCell>
                      <TableCell>{c.telefone || "-"}</TableCell>
                      <TableCell>{c.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700"
                          disabled={!c.telefone}
                          onClick={() => window.open(buildWhatsAppLink(c.telefone), "_blank")}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingContato(c);
                            setContatoFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingContato(c)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <FornecedorFormDialog
        open={fornecedorFormOpen}
        onOpenChange={setFornecedorFormOpen}
        fornecedor={editingFornecedor}
        onSaved={load}
      />

      <PrecoFormDialog
        open={precoFormOpen}
        onOpenChange={setPrecoFormOpen}
        preco={editingPreco}
        fornecedores={fornecedores}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deletingFornecedor}
        onOpenChange={(o) => !o && setDeletingFornecedor(null)}
        onConfirm={handleDeleteFornecedor}
        itemLabel={deletingFornecedor?.nome ?? undefined}
        loading={deleteFornecedorLoading}
      />

      <ConfirmDeleteDialog
        open={!!deletingPreco}
        onOpenChange={(o) => !o && setDeletingPreco(null)}
        onConfirm={handleDeletePreco}
        itemLabel={deletingPreco?.material ?? undefined}
        loading={deletePrecoLoading}
      />

      <ContatoFormDialog
        open={contatoFormOpen}
        onOpenChange={setContatoFormOpen}
        contato={editingContato}
        fornecedores={fornecedores}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deletingContato}
        onOpenChange={(o) => !o && setDeletingContato(null)}
        onConfirm={handleDeleteContato}
        itemLabel={deletingContato?.nome ?? undefined}
        loading={deleteContatoLoading}
      />
    </>
  );
}
