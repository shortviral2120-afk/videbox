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
import { Textarea } from "@/components/ui/textarea";
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
import type { Cliente, Prioridade } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const PRIORIDADES: Prioridade[] = ["Alta", "Média", "Baixa"];

export function ServicoFormDialog({
  open,
  onOpenChange,
  clientes,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  onCreated: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cliente_id: "",
    titulo: "",
    descricao: "",
    prioridade: "Média" as Prioridade,
    data_orcamento: toInputDate(new Date()),
  });

  useEffect(() => {
    if (open) {
      setForm({
        cliente_id: "",
        titulo: "",
        descricao: "",
        prioridade: "Média",
        data_orcamento: toInputDate(new Date()),
      });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (!form.titulo) {
      toast.error("Informe o título do serviço.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("servicos")
      .insert({
        cliente_id: form.cliente_id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        prioridade: form.prioridade,
        data_orcamento: form.data_orcamento || null,
        fase: "Orçamento",
        status_pagamento: "Aguardando entrada",
        valor_total: 0,
        valor_entrada: 0,
      })
      .select()
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error("Erro ao criar serviço.");
      return;
    }

    toast.success("Serviço criado!");
    onCreated(data.id);
    onOpenChange(false);
    setForm({
      cliente_id: "",
      titulo: "",
      descricao: "",
      prioridade: "Média",
      data_orcamento: toInputDate(new Date()),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={form.cliente_id}
              onValueChange={(v) => setForm((f) => ({ ...f, cliente_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Box de banheiro"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={form.prioridade}
                onValueChange={(v) => setForm((f) => ({ ...f, prioridade: v as Prioridade }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_orcamento">Data do orçamento</Label>
              <Input
                id="data_orcamento"
                type="date"
                value={form.data_orcamento}
                onChange={(e) => setForm((f) => ({ ...f, data_orcamento: e.target.value }))}
              />
            </div>
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
