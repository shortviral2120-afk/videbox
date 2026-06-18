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
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ServicoItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ServicoItemFormDialog({
  open,
  onOpenChange,
  servicoId,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicoId: string;
  item: ServicoItem | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    material: "",
    largura: "",
    altura: "",
    preco_m2: "",
    quantidade: "1",
  });

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          descricao: item.descricao,
          material: item.material ?? "",
          largura: String(item.largura ?? ""),
          altura: String(item.altura ?? ""),
          preco_m2: String(item.preco_m2 ?? ""),
          quantidade: String(item.quantidade ?? "1"),
        });
      } else {
        setForm({
          descricao: "",
          material: "",
          largura: "",
          altura: "",
          preco_m2: "",
          quantidade: "1",
        });
      }
    }
  }, [open, item]);

  const larguraNum = Number(form.largura) || 0;
  const alturaNum = Number(form.altura) || 0;
  const precoM2Num = Number(form.preco_m2) || 0;
  const quantidadeNum = Number(form.quantidade) || 1;
  const areaPreview = larguraNum * alturaNum;
  const totalPreview = areaPreview * precoM2Num * quantidadeNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao.trim()) {
      toast.error("Informe a descrição.");
      return;
    }
    if (!form.largura || !form.altura || !form.preco_m2) {
      toast.error("Informe largura, altura e preço por m².");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      servico_id: servicoId,
      descricao: form.descricao.trim(),
      material: form.material.trim() || null,
      largura: Number(form.largura),
      altura: Number(form.altura),
      preco_m2: Number(form.preco_m2),
      quantidade: Number(form.quantidade) || 1,
    };

    const { error } = item
      ? await supabase.from("servico_itens").update(payload).eq("id", item.id)
      : await supabase.from("servico_itens").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar item.");
      return;
    }

    toast.success(item ? "Item atualizado!" : "Item adicionado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={form.material}
              onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="largura">Largura (m) *</Label>
              <Input
                id="largura"
                type="number"
                step="0.01"
                min="0"
                value={form.largura}
                onChange={(e) => setForm((f) => ({ ...f, largura: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altura">Altura (m) *</Label>
              <Input
                id="altura"
                type="number"
                step="0.01"
                min="0"
                value={form.altura}
                onChange={(e) => setForm((f) => ({ ...f, altura: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_m2">Preço por m² *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={form.quantidade}
                onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Área: {areaPreview.toFixed(2)} m² · Total: {formatCurrency(totalPreview)}
          </p>

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
