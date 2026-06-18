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
import type { Cliente, Pagamento, StatusPagamento } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const STATUS: StatusPagamento[] = [
  "Aguardando entrada",
  "Em dia",
  "Vencido",
  "Parcelado",
  "Quitado",
];

export function PagamentoFormDialog({
  open,
  onOpenChange,
  pagamento,
  clientes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: Pagamento | null;
  clientes: Cliente[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cliente_id: "",
    servico: "",
    data_servico: "",
    valor_total: "",
    valor_pago: "",
    data_vencimento: "",
    status: "Aguardando entrada" as StatusPagamento,
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      if (pagamento) {
        setForm({
          cliente_id: pagamento.cliente_id,
          servico: pagamento.servico ?? "",
          data_servico: toInputDate(pagamento.data_servico),
          valor_total: String(pagamento.valor_total ?? ""),
          valor_pago: String(pagamento.valor_pago ?? ""),
          data_vencimento: toInputDate(pagamento.data_vencimento),
          status: pagamento.status,
          observacoes: pagamento.observacoes ?? "",
        });
      } else {
        setForm({
          cliente_id: "",
          servico: "",
          data_servico: "",
          valor_total: "",
          valor_pago: "",
          data_vencimento: "",
          status: "Aguardando entrada",
          observacoes: "",
        });
      }
    }
  }, [open, pagamento]);

  const saldo =
    (Number(form.valor_total) || 0) - (Number(form.valor_pago) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (!form.valor_total) {
      toast.error("Informe o valor total.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      cliente_id: form.cliente_id,
      servico: form.servico || null,
      data_servico: form.data_servico || null,
      valor_total: Number(form.valor_total),
      valor_pago: form.valor_pago ? Number(form.valor_pago) : 0,
      data_vencimento: form.data_vencimento || null,
      status: form.status,
      observacoes: form.observacoes || null,
    };

    const { error } = pagamento
      ? await supabase.from("pagamentos").update(payload).eq("id", pagamento.id)
      : await supabase.from("pagamentos").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar pagamento.");
      return;
    }

    toast.success(pagamento ? "Pagamento atualizado!" : "Pagamento registrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pagamento ? "Editar pagamento" : "Novo pagamento"}</DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="data_servico">Data do serviço</Label>
            <Input
              id="data_servico"
              type="date"
              value={form.data_servico}
              onChange={(e) => setForm((f) => ({ ...f, data_servico: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor total (R$) *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_total}
                onChange={(e) => setForm((f) => ({ ...f, valor_total: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_pago">Valor pago (R$)</Label>
              <Input
                id="valor_pago"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_pago}
                onChange={(e) => setForm((f) => ({ ...f, valor_pago: e.target.value }))}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Saldo devedor:{" "}
            <span className="font-semibold text-foreground">
              {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Vencimento do saldo</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={form.data_vencimento}
                onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusPagamento }))}
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
