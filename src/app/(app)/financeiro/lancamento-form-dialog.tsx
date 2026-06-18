"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type {
  BancoConta,
  CategoriaBanco,
  CategoriaLancamento,
  Lancamento,
  Servico,
  TipoLancamento,
} from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const TIPOS: TipoLancamento[] = ["Entrada", "Saída"];

const CATEGORIAS_BANCO: CategoriaBanco[] = ["Empresa", "Pessoal"];

const CATEGORIAS: CategoriaLancamento[] = [
  "Material/Vidro",
  "Combustível/Transporte",
  "Mão de obra",
  "Ferramentas",
  "Pagamento recebido",
  "Outros",
];

function todayInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const NONE_VALUE = "__none__";

export function LancamentoFormDialog({
  open,
  onOpenChange,
  lancamento,
  bancos,
  servicos,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamento: Lancamento | null;
  bancos: BancoConta[];
  servicos: Servico[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    data: "",
    tipo: "Entrada" as TipoLancamento,
    banco_id: "",
    categoria_tipo: "Empresa" as CategoriaBanco,
    servico_id: "" as string,
    descricao: "",
    valor: "",
    categoria: "" as CategoriaLancamento | "",
    cliente_fornecedor: "",
  });

  useEffect(() => {
    if (open) {
      if (lancamento) {
        setForm({
          data: toInputDate(lancamento.data),
          tipo: lancamento.tipo,
          banco_id: lancamento.banco_id ?? "",
          categoria_tipo: lancamento.categoria_tipo,
          servico_id: lancamento.servico_id ?? "",
          descricao: lancamento.descricao ?? "",
          valor: String(lancamento.valor ?? ""),
          categoria: lancamento.categoria ?? "",
          cliente_fornecedor: lancamento.cliente_fornecedor ?? "",
        });
      } else {
        setForm({
          data: todayInputDate(),
          tipo: "Entrada",
          banco_id: "",
          categoria_tipo: "Empresa",
          servico_id: "",
          descricao: "",
          valor: "",
          categoria: "",
          cliente_fornecedor: "",
        });
      }
    }
  }, [open, lancamento]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data) {
      toast.error("Informe a data.");
      return;
    }
    if (!form.banco_id) {
      toast.error("Selecione o banco.");
      return;
    }
    if (!form.valor) {
      toast.error("Informe o valor.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      data: form.data,
      tipo: form.tipo,
      banco_id: form.banco_id,
      categoria_tipo: form.categoria_tipo,
      servico_id: form.servico_id || null,
      descricao: form.descricao || null,
      valor: Number(form.valor),
      categoria: form.categoria || null,
      cliente_fornecedor: form.cliente_fornecedor || null,
    };

    const { error } = lancamento
      ? await supabase.from("lancamentos").update(payload).eq("id", lancamento.id)
      : await supabase.from("lancamentos").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar lançamento.");
      return;
    }

    toast.success(lancamento ? "Lançamento atualizado!" : "Lançamento registrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lancamento ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoLancamento }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banco *</Label>
              <Select
                value={form.banco_id}
                onValueChange={(v) => setForm((f) => ({ ...f, banco_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Empresa/Pessoal *</Label>
              <Select
                value={form.categoria_tipo}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, categoria_tipo: v as CategoriaBanco }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_BANCO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria || NONE_VALUE}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    categoria: v === NONE_VALUE ? "" : (v as CategoriaLancamento),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Serviço vinculado</Label>
            <Select
              value={form.servico_id || NONE_VALUE}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, servico_id: v === NONE_VALUE ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                {servicos.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente_fornecedor">Cliente/Fornecedor</Label>
            <Input
              id="cliente_fornecedor"
              value={form.cliente_fornecedor}
              onChange={(e) => setForm((f) => ({ ...f, cliente_fornecedor: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
