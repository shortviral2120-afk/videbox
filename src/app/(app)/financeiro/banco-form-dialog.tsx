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
import { Loader2 } from "lucide-react";
import type { BancoConta, CategoriaBanco, TipoBanco } from "@/lib/types";

const TIPOS: TipoBanco[] = ["Banco", "Carteira Digital", "Dinheiro/Caixa Físico", "Outro"];

const CATEGORIAS: CategoriaBanco[] = ["Empresa", "Pessoal"];

export function BancoFormDialog({
  open,
  onOpenChange,
  banco,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banco: BancoConta | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "Banco" as TipoBanco,
    categoria: "Empresa" as CategoriaBanco,
    saldo_inicial: "0",
    ativo: true,
  });

  useEffect(() => {
    if (open) {
      if (banco) {
        setForm({
          nome: banco.nome ?? "",
          tipo: banco.tipo,
          categoria: banco.categoria,
          saldo_inicial: String(banco.saldo_inicial ?? "0"),
          ativo: banco.ativo,
        });
      } else {
        setForm({
          nome: "",
          tipo: "Banco",
          categoria: "Empresa",
          saldo_inicial: "0",
          ativo: true,
        });
      }
    }
  }, [open, banco]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("O nome da conta é obrigatório.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      categoria: form.categoria,
      saldo_inicial: form.saldo_inicial ? Number(form.saldo_inicial) : 0,
      ativo: form.ativo,
    };

    const { error } = banco
      ? await supabase.from("bancos").update(payload).eq("id", banco.id)
      : await supabase.from("bancos").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar conta.");
      return;
    }

    toast.success(banco ? "Conta atualizada!" : "Conta cadastrada!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{banco ? "Editar banco" : "Novo banco"}</DialogTitle>
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
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoBanco }))}
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
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria: v as CategoriaBanco }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="saldo_inicial">Saldo inicial (R$)</Label>
            <Input
              id="saldo_inicial"
              type="number"
              step="0.01"
              value={form.saldo_inicial}
              onChange={(e) => setForm((f) => ({ ...f, saldo_inicial: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="ativo"
              checked={form.ativo}
              onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v === true }))}
            />
            <Label htmlFor="ativo">Conta ativa</Label>
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
