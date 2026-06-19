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
import type { Material, ServicoItem, TipoProduto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ajustarMedida } from "@/lib/medidas";

const NONE_VALUE = "__none__";

const TIPOS_PRODUTO: TipoProduto[] = [
  "Janela Fixa",
  "Janela Móvel",
  "Janela Fixa + Móvel",
  "Janela 2 Fixas",
  "Janela 2 Móveis",
  "Box Frontal",
  "Box L",
  "Box Frontal + Lateral",
  "Porta Vasculhante",
  "Porta Inteira",
  "Espelho",
  "Película",
  "Outro",
];

function formStateFromItem(item: ServicoItem | null) {
  return {
    tipo_produto: (item?.tipo_produto ?? "") as TipoProduto | "",
    descricao: item?.descricao ?? "",
    material_id: "",
    material: item?.material ?? "",
    largura: String(item?.largura ?? ""),
    larguraOriginal: item?.largura_original != null ? String(item.largura_original) : "",
    folgaLarguraCm: 0,
    altura: String(item?.altura ?? ""),
    alturaOriginal: item?.altura_original != null ? String(item.altura_original) : "",
    folgaAlturaCm: 0,
    preco_m2: String(item?.preco_m2 ?? ""),
    quantidade: String(item?.quantidade ?? "1"),
    observacao: item?.observacao ?? "",
  };
}

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
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [form, setForm] = useState(formStateFromItem(null));

  useEffect(() => {
    if (open) {
      setForm(formStateFromItem(item));
      const supabase = createClient();
      supabase
        .from("materiais")
        .select("*")
        .eq("ativo", true)
        .order("nome")
        .then(({ data }) => setMateriais(data ? (data as Material[]) : []));
    }
  }, [open, item]);

  const materialSelecionado = materiais.find((m) => m.id === form.material_id) ?? null;

  function handleTipoProdutoChange(tipo: TipoProduto) {
    setForm((f) => ({
      ...f,
      tipo_produto: tipo,
      descricao: !f.descricao.trim() || TIPOS_PRODUTO.includes(f.descricao as TipoProduto) ? tipo : f.descricao,
    }));
  }

  function handleMaterialChange(materialId: string) {
    if (materialId === NONE_VALUE) {
      setForm((f) => ({ ...f, material_id: "", material: "" }));
      return;
    }
    const material = materiais.find((m) => m.id === materialId);
    setForm((f) => ({
      ...f,
      material_id: materialId,
      material: material?.nome ?? "",
      preco_m2: material ? String(material.preco_m2) : f.preco_m2,
    }));
  }

  function handleLarguraBlur() {
    const valor = Number(form.largura);
    if (!valor) return;
    const { ajustado, folgaCm } = ajustarMedida(valor);
    setForm((f) => ({
      ...f,
      larguraOriginal: String(valor),
      largura: String(ajustado),
      folgaLarguraCm: folgaCm,
    }));
  }

  function handleAlturaBlur() {
    const valor = Number(form.altura);
    if (!valor) return;
    const { ajustado, folgaCm } = ajustarMedida(valor);
    setForm((f) => ({
      ...f,
      alturaOriginal: String(valor),
      altura: String(ajustado),
      folgaAlturaCm: folgaCm,
    }));
  }

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
    if (!form.tipo_produto) {
      toast.error("Selecione o tipo de produto.");
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
      tipo_produto: form.tipo_produto || null,
      material: form.material.trim() || null,
      largura: Number(form.largura),
      altura: Number(form.altura),
      largura_original: form.larguraOriginal ? Number(form.larguraOriginal) : null,
      altura_original: form.alturaOriginal ? Number(form.alturaOriginal) : null,
      preco_m2: Number(form.preco_m2),
      quantidade: Number(form.quantidade) || 1,
      observacao: form.observacao.trim() || null,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de produto *</Label>
            <Select
              value={form.tipo_produto || undefined}
              onValueChange={(v) => handleTipoProdutoChange(v as TipoProduto)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PRODUTO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label>Material</Label>
            <Select value={form.material_id || NONE_VALUE} onValueChange={handleMaterialChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                {materiais.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {materialSelecionado && (
              <p className="text-xs text-muted-foreground">
                ({formatCurrency(materialSelecionado.preco_m2)}/m² conforme catálogo)
              </p>
            )}
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
                onBlur={handleLarguraBlur}
                required
              />
              {form.larguraOriginal && (
                <p className="text-xs text-muted-foreground">
                  Medida ajustada: {Number(form.largura).toFixed(2)} m (original:{" "}
                  {Number(form.larguraOriginal).toFixed(2)} m + {form.folgaLarguraCm} cm de folga)
                </p>
              )}
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
                onBlur={handleAlturaBlur}
                required
              />
              {form.alturaOriginal && (
                <p className="text-xs text-muted-foreground">
                  Medida ajustada: {Number(form.altura).toFixed(2)} m (original:{" "}
                  {Number(form.alturaOriginal).toFixed(2)} m + {form.folgaAlturaCm} cm de folga)
                </p>
              )}
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

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={form.observacao}
              onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
              rows={2}
            />
          </div>

          <p className="text-sm font-medium">
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
