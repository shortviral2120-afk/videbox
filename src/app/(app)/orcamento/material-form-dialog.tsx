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
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Material } from "@/lib/types";

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco_m2: "",
  });

  useEffect(() => {
    if (open) {
      if (material) {
        setForm({
          nome: material.nome,
          descricao: material.descricao ?? "",
          preco_m2: String(material.preco_m2 ?? ""),
        });
      } else {
        setForm({ nome: "", descricao: "", preco_m2: "" });
      }
    }
  }, [open, material]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("O nome do material é obrigatório.");
      return;
    }
    if (!form.preco_m2) {
      toast.error("Informe o preço por m².");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      preco_m2: Number(form.preco_m2),
    };

    const { error } = material
      ? await supabase.from("materiais").update(payload).eq("id", material.id)
      : await supabase.from("materiais").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar material.");
      return;
    }

    toast.success(material ? "Material atualizado!" : "Material cadastrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? "Editar material" : "Novo material"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              rows={2}
            />
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
