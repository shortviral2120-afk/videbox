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
import type { Fornecedor, FornecedorContato } from "@/lib/types";

export function ContatoFormDialog({
  open,
  onOpenChange,
  contato,
  fornecedores,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato: FornecedorContato | null;
  fornecedores: Fornecedor[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fornecedor_id: "",
    nome: "",
    cargo: "",
    telefone: "",
    email: "",
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      if (contato) {
        setForm({
          fornecedor_id: contato.fornecedor_id ?? "",
          nome: contato.nome ?? "",
          cargo: contato.cargo ?? "",
          telefone: contato.telefone ?? "",
          email: contato.email ?? "",
          observacoes: contato.observacoes ?? "",
        });
      } else {
        setForm({
          fornecedor_id: "",
          nome: "",
          cargo: "",
          telefone: "",
          email: "",
          observacoes: "",
        });
      }
    }
  }, [open, contato]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fornecedor_id) {
      toast.error("Selecione o fornecedor.");
      return;
    }
    if (!form.nome.trim()) {
      toast.error("O nome do contato é obrigatório.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      fornecedor_id: form.fornecedor_id,
      nome: form.nome.trim(),
      cargo: form.cargo || null,
      telefone: form.telefone || null,
      email: form.email || null,
      observacoes: form.observacoes || null,
    };

    const { error } = contato
      ? await supabase.from("fornecedor_contatos").update(payload).eq("id", contato.id)
      : await supabase.from("fornecedor_contatos").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar contato.");
      return;
    }

    toast.success(contato ? "Contato atualizado!" : "Contato cadastrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contato ? "Editar contato" : "Novo contato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fornecedor *</Label>
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
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={form.cargo}
                onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
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
