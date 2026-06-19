"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Material, Servico } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { ServicoFormDialog } from "@/app/(app)/servicos/servico-form-dialog";
import { MaterialFormDialog } from "./material-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { faseServicoColor } from "@/lib/status-styles";
import { toast } from "sonner";

const STATUS_FILTER = ["Todos", "Pendente", "Aprovado", "Concluído"] as const;

type StatusFilter = (typeof STATUS_FILTER)[number];

export function OrcamentosClient() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [itensTotalMap, setItensTotalMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [novoOrcamentoOpen, setNovoOrcamentoOpen] = useState(false);

  const [materiais, setMateriais] = useState<Material[]>([]);
  const [materiaisLoading, setMateriaisLoading] = useState(true);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [deletingMaterialLoading, setDeletingMaterialLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [servRes, itensRes, cliRes] = await Promise.all([
      supabase
        .from("servicos")
        .select("*, clientes(nome, telefone)")
        .order("created_at", { ascending: false }),
      supabase.from("servico_itens").select("servico_id, valor_total"),
      supabase.from("clientes").select("*").order("nome"),
    ]);

    if (servRes.data) setServicos(servRes.data as unknown as Servico[]);
    if (cliRes.data) setClientes(cliRes.data as Cliente[]);

    const map = new Map<string, number>();
    if (itensRes.data) {
      for (const row of itensRes.data as { servico_id: string; valor_total: number }[]) {
        map.set(row.servico_id, (map.get(row.servico_id) ?? 0) + row.valor_total);
      }
    }
    setItensTotalMap(map);
    setLoading(false);
  }

  async function loadMateriais() {
    setMateriaisLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("materiais").select("*").order("nome");
    setMateriais(data ? (data as Material[]) : []);
    setMateriaisLoading(false);
  }

  useEffect(() => {
    load();
    loadMateriais();
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

  async function handleDeleteMaterial() {
    if (!deletingMaterial) return;
    setDeletingMaterialLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("materiais").delete().eq("id", deletingMaterial.id);
    setDeletingMaterialLoading(false);
    if (error) {
      toast.error("Erro ao excluir material.");
      return;
    }
    toast.success("Material excluído.");
    setDeletingMaterial(null);
    loadMateriais();
  }

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Acompanhe e aprove os orçamentos dos serviços"
        action={
          <Button onClick={() => setNovoOrcamentoOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        }
      />

      <Tabs defaultValue="orcamentos">
        <TabsList>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="materiais">Catálogo de Materiais</TabsTrigger>
        </TabsList>

        <TabsContent value="orcamentos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
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
        </TabsContent>

        <TabsContent value="materiais" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingMaterial(null);
                setMaterialFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Material
            </Button>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            {materiaisLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : materiais.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum material cadastrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Preço/m²</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiais.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nome}</TableCell>
                      <TableCell>{m.descricao ?? "-"}</TableCell>
                      <TableCell>{formatCurrency(m.preco_m2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingMaterial(m);
                            setMaterialFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingMaterial(m)}>
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

      <ServicoFormDialog
        open={novoOrcamentoOpen}
        onOpenChange={setNovoOrcamentoOpen}
        clientes={clientes}
        onCreated={(id) => router.push(`/orcamento/${id}`)}
      />

      <MaterialFormDialog
        open={materialFormOpen}
        onOpenChange={setMaterialFormOpen}
        material={editingMaterial}
        onSaved={loadMateriais}
      />

      <ConfirmDeleteDialog
        open={!!deletingMaterial}
        onOpenChange={(o) => !o && setDeletingMaterial(null)}
        onConfirm={handleDeleteMaterial}
        itemLabel={deletingMaterial?.nome}
        loading={deletingMaterialLoading}
      />
    </>
  );
}
