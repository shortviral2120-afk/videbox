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
import type { FormaPagamentoServico, Servico } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const FORMAS: FormaPagamentoServico[] = ["PIX", "Dinheiro", "Cartão", "Transferência", "Outro"];

export function ServicoPagamentoFormDialog({
  open,
  onOpenChange,
  servico,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico: Servico;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [valor, setValor] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [forma, setForma] = useState<FormaPagamentoServico | "">("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (open) {
      setValor("");
      setDataPagamento(toInputDate(new Date()));
      setForma("");
      setObservacao("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valor) {
      toast.error("Informe o valor.");
      return;
    }
    if (!dataPagamento) {
      toast.error("Informe a data do pagamento.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const valorNum = Number(valor);
    const { error: insertError } = await supabase.from("servico_pagamentos").insert({
      servico_id: servico.id,
      valor: valorNum,
      data_pagamento: dataPagamento,
      forma: forma || null,
      observacao: observacao.trim() || null,
    });
    if (insertError) {
      toast.error("Erro ao registrar pagamento.");
      setLoading(false);
      return;
    }
    const novoValorEntrada = servico.valor_entrada + valorNum;
    const novoStatus = novoValorEntrada >= servico.valor_total ? "Quitado" : "Entrada recebida";
    const { error: updateError } = await supabase
      .from("servicos")
      .update({
        valor_entrada: novoValorEntrada,
        status_pagamento: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", servico.id);
    if (updateError) {
      toast.error("Pagamento registrado, mas houve erro ao atualizar o saldo do serviço.");
      setLoading(false);
      return;
    }
    toast.success("Pagamento registrado!");
    setLoading(false);
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data do pagamento *</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma">Forma</Label>
            <Select
              value={forma}
              onValueChange={(v) => setForma(v as FormaPagamentoServico)}
            >
              <SelectTrigger id="forma">
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {FORMAS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
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
