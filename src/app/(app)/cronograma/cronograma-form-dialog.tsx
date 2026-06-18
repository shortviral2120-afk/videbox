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
import type { Cliente, Cronograma, FaseCronograma, MaterialChegou, Prioridade } from "@/lib/types";
import { fasesCronograma } from "@/lib/status-styles";
import { toInputDate } from "@/lib/utils";

const PRIORIDADES: Prioridade[] = ["Alta", "Média", "Baixa"];

const MATERIAL_CHEGOU_OPTIONS: MaterialChegou[] = ["Sim", "Não", "A caminho"];

export function CronogramaFormDialog({
  open,
  onOpenChange,
  item,
  clientes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Cronograma | null;
  clientes: Cliente[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cliente_id: "",
    servico: "",
    previsao_inicio: "",
    previsao_conclusao: "",
    fase: "Novo orçamento" as FaseCronograma,
    prioridade: "Média" as Prioridade,
    fornecedor_material: "",
    material_chegou: "Não" as MaterialChegou,
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          cliente_id: item.cliente_id,
          servico: item.servico ?? "",
          previsao_inicio: toInputDate(item.previsao_inicio),
          previsao_conclusao: toInputDate(item.previsao_conclusao),
          fase: item.fase,
          prioridade: item.prioridade,
          fornecedor_material: item.fornecedor_material ?? "",
          material_chegou: item.material_chegou ?? "Não",
          observacoes: item.observacoes ?? "",
        });
      } else {
        setForm({
          cliente_id: "",
          servico: "",
          previsao_inicio: "",
          previsao_conclusao: "",
          fase: "Novo orçamento",
          prioridade: "Média",
          fornecedor_material: "",
          material_chegou: "Não",
          observacoes: "",
        });
      }
    }
  }, [open, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      toast.error("Selecione um cliente.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      cliente_id: form.cliente_id,
      servico: form.servico || null,
      previsao_inicio: form.previsao_inicio || null,
      previsao_conclusao: form.previsao_conclusao || null,
      fase: form.fase,
      prioridade: form.prioridade,
      fornecedor_material: form.fornecedor_material || null,
      material_chegou: form.material_chegou,
      observacoes: form.observacoes || null,
    };

    const { error } = item
      ? await supabase.from("cronograma").update(payload).eq("id", item.id)
      : await supabase.from("cronograma").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar serviço.");
      return;
    }

    toast.success(item ? "Serviço atualizado!" : "Serviço registrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar serviço" : "Novo serviço"}</DialogTitle>
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
            <Label htmlFor="servico">Serviço</Label>
            <Input
              id="servico"
              value={form.servico}
              onChange={(e) => setForm((f) => ({ ...f, servico: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="previsao_inicio">Previsão de início</Label>
              <Input
                id="previsao_inicio"
                type="date"
                value={form.previsao_inicio}
                onChange={(e) => setForm((f) => ({ ...f, previsao_inicio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previsao_conclusao">Previsão de conclusão</Label>
              <Input
                id="previsao_conclusao"
                type="date"
                value={form.previsao_conclusao}
                onChange={(e) => setForm((f) => ({ ...f, previsao_conclusao: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fase atual</Label>
              <Select
                value={form.fase}
                onValueChange={(v) => setForm((f) => ({ ...f, fase: v as FaseCronograma }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fasesCronograma.map((fase) => (
                    <SelectItem key={fase} value={fase}>
                      {fase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor_material">Fornecedor do material</Label>
              <Input
                id="fornecedor_material"
                value={form.fornecedor_material}
                onChange={(e) => setForm((f) => ({ ...f, fornecedor_material: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Material já chegou</Label>
              <Select
                value={form.material_chegou}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, material_chegou: v as MaterialChegou }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CHEGOU_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              rows={3}
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
