"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Servico } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import { Plus, Search, Trash2, CalendarClock } from "lucide-react";
import { ServicoFormDialog } from "./servico-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fasesServico, faseServicoColor, prioridadeColor } from "@/lib/status-styles";
import { toast } from "sonner";

const FASE_FILTER = ["Todos", ...fasesServico];

export function ServicosClient() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [faseFilter, setFaseFilter] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Servico | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [servRes, cliRes] = await Promise.all([
      supabase
        .from("servicos")
        .select("*, clientes(nome, telefone)")
        .order("created_at", { ascending: false }),
      supabase.from("clientes").select("*").order("nome"),
    ]);
    if (servRes.data) setServicos(servRes.data as unknown as Servico[]);
    if (cliRes.data) setClientes(cliRes.data as Cliente[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return servicos.filter((s) => {
      const matchesSearch = (s.clientes?.nome ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFase = faseFilter === "Todos" || s.fase === faseFilter;
      return matchesSearch && matchesFase;
    });
  }, [servicos, search, faseFilter]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("servicos").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (error) {
      toast.error("Erro ao excluir serviço.");
      return;
    }
    toast.success("Serviço excluído.");
    setDeleting(null);
    load();
  }

  return (
    <>
      <PageHeader
        title="Serviços"
        description="Acompanhe cada serviço do orçamento à conclusão"
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={faseFilter} onValueChange={setFaseFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FASE_FILTER.map((f) => (
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
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Nenhum serviço encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Link key={s.id} href={`/servicos/${s.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-base">{s.clientes?.nome ?? "-"}</p>
                      <p className="text-sm text-muted-foreground">{s.titulo}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleting(s);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={faseServicoColor[s.fase]} variant="outline">
                      {s.fase}
                    </Badge>
                    <Badge className={prioridadeColor[s.prioridade]} variant="outline">
                      {s.prioridade}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-medium">{formatCurrency(s.valor_total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p
                        className={
                          s.saldo_devedor > 0
                            ? "font-medium text-destructive"
                            : "font-medium text-success"
                        }
                      >
                        {formatCurrency(s.saldo_devedor)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {s.data_instalacao ? formatDate(s.data_instalacao) : "Sem data"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ServicoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clientes={clientes}
        onCreated={(id) => router.push(`/servicos/${id}`)}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
        itemLabel={deleting?.titulo}
        loading={deleteLoading}
      />
    </>
  );
}
