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
import type { Fornecedor, PrecoMaterial } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

export function PrecoFormDialog({
  open,
  onOpenChange,
  preco,
  fornecedores,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preco: PrecoMaterial | null;
  fornecedores: Fornecedor[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    material: "",
    espessura_tipo: "",
    fornecedor_id: "",
    preco_m2: "",
    data_cotacao: "",
    validade: "",
  });

  useEffect(() => {
    if (open) {
      if (preco) {
        setForm({
          material: preco.material ?? "",
          espessura_tipo: preco.espessura_tipo ?? "",
          fornecedor_id: preco.fornecedor_id ?? "",
          preco_m2: String(preco.preco_m2 ?? ""),
          data_cotacao: toInputDate(preco.data_cotacao),
          validade: toInputDate(preco.validade),
        });
      } else {
        setForm({
          material: "",
          espessura_tipo: "",
          fornecedor_id: "",
          preco_m2: "",
          data_cotacao: "",
          validade: "",
        });
      }
    }
  }, [open, preco]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.material.trim()) {
      toast.error("O material é obrigatório.");
      return;
    }
    if (!form.preco_m2) {
      toast.error("Informe o preço por m².");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      material: form.material.trim(),
      espessura_tipo: form.espessura_tipo || null,
      fornecedor_id: form.fornecedor_id || null,
      preco_m2: Number(form.preco_m2),
      data_cotacao: form.data_cotacao || null,
      validade: form.validade || null,
    };

    const { error } = preco
      ? await supabase.from("precos_materiais").update(payload).eq("id", preco.id)
      : await supabase.from("precos_materiais").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar preço.");
      return;
    }

    toast.success(preco ? "Preço atualizado!" : "Preço cadastrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{preco ? "Editar preço" : "Novo preço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material">Material *</Label>
            <Input
              id="material"
              value={form.material}
              onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="espessura_tipo">Espessura/tipo</Label>
            <Input
              id="espessura_tipo"
              value={form.espessura_tipo}
              onChange={(e) => setForm((f) => ({ ...f, espessura_tipo: e.target.value }))}
              placeholder="Ex: 8mm temperado"
            />
          </div>

          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select
              value={form.fornecedor_id}
              onValueChange={(v) => setForm((f) => ({ ...f, fornecedor_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco_m2">Preço por m² (R$) *</Label>
            <Input
              id="preco_m2"
              type="number"
              step="0.01"
              min="0"
              value={form.preco_m2}
              onChange={(e) => setForm((f) => ({ ...f, preco_m2: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_cotacao">Data da cotação</Label>
              <Input
                id="data_cotacao"
                type="date"
                value={form.data_cotacao}
                onChange={(e) => setForm((f) => ({ ...f, data_cotacao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validade">Validade</Label>
              <Input
                id="validade"
                type="date"
                value={form.validade}
                onChange={(e) => setForm((f) => ({ ...f, validade: e.target.value }))}
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
