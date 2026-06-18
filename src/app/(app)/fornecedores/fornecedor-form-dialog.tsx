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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import type { Fornecedor, FormaPagamento } from "@/lib/types";
import { cn } from "@/lib/utils";

const FORMAS_PAGAMENTO: FormaPagamento[] = [
  "Dinheiro",
  "PIX",
  "Boleto",
  "Cartão",
  "Transferência",
  "Outros",
];

export function FornecedorFormDialog({
  open,
  onOpenChange,
  fornecedor,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor: Fornecedor | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    contato: "",
    telefone: "",
    produto_principal: "",
    prazo_entrega: "",
    forma_pagamento: "" as FormaPagamento | "",
    avaliacao: 0,
    observacoes: "",
    ativo: true,
  });

  useEffect(() => {
    if (open) {
      if (fornecedor) {
        setForm({
          nome: fornecedor.nome ?? "",
          contato: fornecedor.contato ?? "",
          telefone: fornecedor.telefone ?? "",
          produto_principal: fornecedor.produto_principal ?? "",
          prazo_entrega:
            fornecedor.prazo_entrega != null ? String(fornecedor.prazo_entrega) : "",
          forma_pagamento: fornecedor.forma_pagamento ?? "",
          avaliacao: fornecedor.avaliacao ?? 0,
          observacoes: fornecedor.observacoes ?? "",
          ativo: fornecedor.ativo,
        });
      } else {
        setForm({
          nome: "",
          contato: "",
          telefone: "",
          produto_principal: "",
          prazo_entrega: "",
          forma_pagamento: "",
          avaliacao: 0,
          observacoes: "",
          ativo: true,
        });
      }
    }
  }, [open, fornecedor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("O nome do fornecedor é obrigatório.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      nome: form.nome.trim(),
      contato: form.contato || null,
      telefone: form.telefone || null,
      produto_principal: form.produto_principal || null,
      prazo_entrega: form.prazo_entrega ? Number(form.prazo_entrega) : null,
      forma_pagamento: form.forma_pagamento || null,
      avaliacao: form.avaliacao || null,
      observacoes: form.observacoes || null,
      ativo: form.ativo,
    };

    const { error } = fornecedor
      ? await supabase.from("fornecedores").update(payload).eq("id", fornecedor.id)
      : await supabase.from("fornecedores").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar fornecedor.");
      return;
    }

    toast.success(fornecedor ? "Fornecedor atualizado!" : "Fornecedor cadastrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{fornecedor ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                value={form.contato}
                onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="produto_principal">Produto principal</Label>
            <Input
              id="produto_principal"
              value={form.produto_principal}
              onChange={(e) =>
                setForm((f) => ({ ...f, produto_principal: e.target.value }))
              }
              placeholder="Ex: Vidro temperado, Ferragens..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prazo_entrega">Prazo de entrega (dias)</Label>
              <Input
                id="prazo_entrega"
                type="number"
                min="0"
                value={form.prazo_entrega}
                onChange={(e) => setForm((f) => ({ ...f, prazo_entrega: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={form.forma_pagamento}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, forma_pagamento: v as FormaPagamento }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Avaliação</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, avaliacao: i }))}
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      i <= form.avaliacao
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="ativo"
              checked={form.ativo}
              onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v === true }))}
            />
            <Label htmlFor="ativo">Fornecedor ativo</Label>
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
