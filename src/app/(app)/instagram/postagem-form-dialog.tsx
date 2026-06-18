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
import type { FormatoPostagem, Postagem, StatusPostagem, TipoPostagem } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

const TIPOS: TipoPostagem[] = [
  "Antes e Depois",
  "Serviço concluído",
  "Dica técnica",
  "Depoimento",
  "Promoção",
  "Bastidor",
  "Outros",
];

const FORMATOS: FormatoPostagem[] = ["Reels", "Carrossel", "Foto única", "Story"];

const STATUS: StatusPostagem[] = ["Publicado", "Agendado", "Não publicado"];

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export function PostagemFormDialog({
  open,
  onOpenChange,
  postagem,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postagem: Postagem | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    data: "",
    tipo: "Antes e Depois" as TipoPostagem,
    tema: "",
    formato: "Reels" as FormatoPostagem,
    hashtags: "",
    status: "Não publicado" as StatusPostagem,
    alcance: "",
    interacoes: "",
  });

  useEffect(() => {
    if (open) {
      if (postagem) {
        setForm({
          data: toInputDate(postagem.data),
          tipo: postagem.tipo,
          tema: postagem.tema ?? "",
          formato: postagem.formato,
          hashtags: postagem.hashtags ?? "",
          status: postagem.status,
          alcance: String(postagem.alcance ?? ""),
          interacoes: String(postagem.interacoes ?? ""),
        });
      } else {
        setForm({
          data: todayInputDate(),
          tipo: "Antes e Depois",
          tema: "",
          formato: "Reels",
          hashtags: "",
          status: "Não publicado",
          alcance: "",
          interacoes: "",
        });
      }
    }
  }, [open, postagem]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data) {
      toast.error("Informe a data.");
      return;
    }
    if (!form.tipo) {
      toast.error("Selecione o tipo.");
      return;
    }
    if (!form.formato) {
      toast.error("Selecione o formato.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      data: form.data,
      tipo: form.tipo,
      tema: form.tema || null,
      formato: form.formato,
      hashtags: form.hashtags || null,
      status: form.status,
      alcance: form.alcance ? Number(form.alcance) : null,
      interacoes: form.interacoes ? Number(form.interacoes) : null,
    };

    const { error } = postagem
      ? await supabase.from("postagens").update(payload).eq("id", postagem.id)
      : await supabase.from("postagens").insert(payload);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar postagem.");
      return;
    }

    toast.success(postagem ? "Postagem atualizada!" : "Postagem registrada!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{postagem ? "Editar postagem" : "Nova postagem"}</DialogTitle>
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
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusPostagem }))}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoPostagem }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato *</Label>
              <Select
                value={form.formato}
                onValueChange={(v) => setForm((f) => ({ ...f, formato: v as FormatoPostagem }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATOS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tema">Tema/Legenda</Label>
            <Textarea
              id="tema"
              value={form.tema}
              onChange={(e) => setForm((f) => ({ ...f, tema: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              value={form.hashtags}
              onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alcance">Alcance</Label>
              <Input
                id="alcance"
                type="number"
                min="0"
                value={form.alcance}
                onChange={(e) => setForm((f) => ({ ...f, alcance: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interacoes">Interações</Label>
              <Input
                id="interacoes"
                type="number"
                min="0"
                value={form.interacoes}
                onChange={(e) => setForm((f) => ({ ...f, interacoes: e.target.value }))}
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
