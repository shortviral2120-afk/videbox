"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lead, Postagem } from "@/lib/types";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PostagemFormDialog } from "./postagem-form-dialog";
import { LeadFormDialog } from "./lead-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const statusPostagemColor: Record<string, string> = {
  Publicado: "bg-success/10 text-success",
  Agendado: "bg-blue-100 text-blue-700",
  "Não publicado": "bg-muted text-muted-foreground",
};

export function InstagramClient() {
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [postagemFormOpen, setPostagemFormOpen] = useState(false);
  const [editingPostagem, setEditingPostagem] = useState<Postagem | null>(null);
  const [deletingPostagem, setDeletingPostagem] = useState<Postagem | null>(null);
  const [deletePostagemLoading, setDeletePostagemLoading] = useState(false);

  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleteLeadLoading, setDeleteLeadLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [postRes, leadRes] = await Promise.all([
      supabase.from("postagens").select("*").order("data", { ascending: false }),
      supabase.from("leads").select("*").order("data", { ascending: false }),
    ]);
    if (postRes.data) setPostagens(postRes.data as Postagem[]);
    if (leadRes.data) setLeads(leadRes.data as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const conversionRate = useMemo(() => {
    if (leads.length === 0) return 0;
    const converted = leads.filter((l) => l.converteu).length;
    return Math.round((converted / leads.length) * 100);
  }, [leads]);

  async function handleDeletePostagem() {
    if (!deletingPostagem) return;
    setDeletePostagemLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("postagens")
      .delete()
      .eq("id", deletingPostagem.id);
    setDeletePostagemLoading(false);
    if (error) {
      toast.error("Erro ao excluir postagem.");
      return;
    }
    toast.success("Postagem excluída.");
    setDeletingPostagem(null);
    load();
  }

  async function handleDeleteLead() {
    if (!deletingLead) return;
    setDeleteLeadLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("leads").delete().eq("id", deletingLead.id);
    setDeleteLeadLoading(false);
    if (error) {
      toast.error("Erro ao excluir lead.");
      return;
    }
    toast.success("Lead excluído.");
    setDeletingLead(null);
    load();
  }

  return (
    <>
      <PageHeader
        title="Instagram / Captação"
        description="Gerencie o calendário de postagens e acompanhe os leads captados"
      />

      <Tabs defaultValue="postagens">
        <TabsList>
          <TabsTrigger value="postagens">Calendário de postagens</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="postagens">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingPostagem(null);
                setPostagemFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova postagem
            </Button>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : postagens.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma postagem encontrada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Tema/Legenda</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alcance</TableHead>
                    <TableHead>Interações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postagens.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.data)}</TableCell>
                      <TableCell>{p.tipo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.formato}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{p.tema || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusPostagemColor[p.status]} variant="outline">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.alcance ?? "-"}</TableCell>
                      <TableCell>{p.interacoes ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPostagem(p);
                            setPostagemFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPostagem(p)}
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

        <TabsContent value="leads">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingLead(null);
                setLeadFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo lead
            </Button>
          </div>

          {!loading && (
            <p className="text-sm text-muted-foreground mb-3">
              {leads.length} leads · {conversionRate}% de conversão
            </p>
          )}

          <div className="rounded-lg border bg-card overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum lead encontrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Como chegou</TableHead>
                    <TableHead>Serviço de interesse</TableHead>
                    <TableHead>Converteu</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatDate(l.data)}</TableCell>
                      <TableCell className="font-medium">{l.nome}</TableCell>
                      <TableCell>{l.telefone || "-"}</TableCell>
                      <TableCell>{l.como_chegou || "-"}</TableCell>
                      <TableCell>{l.servico_interesse || "-"}</TableCell>
                      <TableCell>
                        {l.converteu ? (
                          <Badge variant="success">Sim</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground" variant="outline">
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingLead(l);
                            setLeadFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingLead(l)}>
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

      <PostagemFormDialog
        open={postagemFormOpen}
        onOpenChange={setPostagemFormOpen}
        postagem={editingPostagem}
        onSaved={load}
      />

      <LeadFormDialog
        open={leadFormOpen}
        onOpenChange={setLeadFormOpen}
        lead={editingLead}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deletingPostagem}
        onOpenChange={(o) => !o && setDeletingPostagem(null)}
        onConfirm={handleDeletePostagem}
        itemLabel={deletingPostagem?.tema ?? undefined}
        loading={deletePostagemLoading}
      />

      <ConfirmDeleteDialog
        open={!!deletingLead}
        onOpenChange={(o) => !o && setDeletingLead(null)}
        onConfirm={handleDeleteLead}
        itemLabel={deletingLead?.nome ?? undefined}
        loading={deleteLeadLoading}
      />
    </>
  );
}
