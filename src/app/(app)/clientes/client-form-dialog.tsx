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
import type { Cliente, ComoChegou, StatusCliente } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const COMO_CHEGOU: ComoChegou[] = [
  "Instagram",
  "Indicação",
  "Google",
  "Passou na frente",
  "WhatsApp",
  "Outros",
];

const NONE_VALUE = "__none__";

const STATUS: StatusCliente[] = [
  "Orçamento enviado",
  "Aprovado",
  "Aguardando obra",
  "Em execução",
  "Concluído",
  "Cancelado",
];

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    como_chegou: "" as ComoChegou | "",
    tipo_servico: "",
    data_orcamento: "",
    valor_orcado: "",
    status: "Orçamento enviado" as StatusCliente,
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      if (cliente) {
        setForm({
          nome: cliente.nome ?? "",
          telefone: cliente.telefone ?? "",
          como_chegou: cliente.como_chegou ?? "",
          tipo_servico: cliente.tipo_servico ?? "",
          data_orcamento: toInputDate(cliente.data_orcamento),
          valor_orcado: cliente.valor_orcado != null ? String(cliente.valor_orcado) : "",
          status: cliente.status,
          observacoes: cliente.observacoes ?? "",
        });
      } else {
        setForm({
          nome: "",
          telefone: "",
          como_chegou: "",
          tipo_servico: "",
          data_orcamento: "",
          valor_orcado: "",
          status: "Orçamento enviado",
          observacoes: "",
        });
      }
    }
  }, [open, cliente]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("O nome do cliente é obrigatório.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      como_chegou: form.como_chegou || null,
      tipo_servico: form.tipo_servico || null,
      data_orcamento: form.data_orcamento || null,
      valor_orcado: form.valor_orcado ? Number(form.valor_orcado) : 0,
      status: form.status,
      observacoes: form.observacoes || null,
    };

    const { error } = cliente
      ? await supabase.from("clientes").update(payload).eq("id", cliente.id)
      : await supabase.from("clientes").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar cliente.");
      return;
    }

    toast.success(cliente ? "Cliente atualizado!" : "Cliente cadastrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
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
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Como chegou</Label>
              <Select
                value={form.como_chegou || NONE_VALUE}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    como_chegou: v === NONE_VALUE ? "" : (v as ComoChegou),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                  {COMO_CHEGOU.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_servico">Tipo de serviço</Label>
            <Input
              id="tipo_servico"
              value={form.tipo_servico}
              onChange={(e) => setForm((f) => ({ ...f, tipo_servico: e.target.value }))}
              placeholder="Ex: Box de banheiro, Espelho, Janela..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_orcamento">Data do orçamento</Label>
              <Input
                id="data_orcamento"
                type="date"
                value={form.data_orcamento}
                onChange={(e) => setForm((f) => ({ ...f, data_orcamento: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_orcado">Valor orçado (R$)</Label>
              <Input
                id="valor_orcado"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_orcado}
                onChange={(e) => setForm((f) => ({ ...f, valor_orcado: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusCliente }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
