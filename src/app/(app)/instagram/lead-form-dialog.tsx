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
import { Loader2 } from "lucide-react";
import type { ComoChegou, Lead } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const COMO_CHEGOU: ComoChegou[] = [
  "Instagram",
  "Indicação",
  "Google",
  "Passou na frente",
  "WhatsApp",
  "Outros",
];

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    data: "",
    nome: "",
    telefone: "",
    como_chegou: "Instagram" as ComoChegou,
    servico_interesse: "",
    converteu: false,
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      if (lead) {
        setForm({
          data: toInputDate(lead.data),
          nome: lead.nome,
          telefone: lead.telefone ?? "",
          como_chegou: lead.como_chegou ?? "Instagram",
          servico_interesse: lead.servico_interesse ?? "",
          converteu: lead.converteu,
          observacoes: lead.observacoes ?? "",
        });
      } else {
        setForm({
          data: todayInputDate(),
          nome: "",
          telefone: "",
          como_chegou: "Instagram",
          servico_interesse: "",
          converteu: false,
          observacoes: "",
        });
      }
    }
  }, [open, lead]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data) {
      toast.error("Informe a data.");
      return;
    }
    if (!form.nome) {
      toast.error("Informe o nome.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      data: form.data,
      nome: form.nome,
      telefone: form.telefone || null,
      como_chegou: form.como_chegou,
      servico_interesse: form.servico_interesse || null,
      converteu: form.converteu,
      observacoes: form.observacoes || null,
    };

    const { error } = lead
      ? await supabase.from("leads").update(payload).eq("id", lead.id)
      : await supabase.from("leads").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar lead.");
      return;
    }

    toast.success(lead ? "Lead atualizado!" : "Lead registrado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                required
              />
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
                value={form.como_chegou}
                onValueChange={(v) => setForm((f) => ({ ...f, como_chegou: v as ComoChegou }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="servico_interesse">Serviço de interesse</Label>
            <Input
              id="servico_interesse"
              value={form.servico_interesse}
              onChange={(e) => setForm((f) => ({ ...f, servico_interesse: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="converteu"
              checked={form.converteu}
              onCheckedChange={(v) => setForm((f) => ({ ...f, converteu: v === true }))}
            />
            <Label htmlFor="converteu">Converteu em cliente</Label>
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
