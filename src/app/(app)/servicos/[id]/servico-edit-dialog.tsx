"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { MaterialChegou, Prioridade, Servico } from "@/lib/types";
import { toInputDate } from "@/lib/utils";

interface ServicoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico: Servico;
  onSaved: () => void;
}

export function ServicoEditDialog({
  open,
  onOpenChange,
  servico,
  onSaved,
}: ServicoEditDialogProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("Média");
  const [dataInstalacao, setDataInstalacao] = useState("");
  const [dataVencimentoSaldo, setDataVencimentoSaldo] = useState("");
  const [fornecedorMaterial, setFornecedorMaterial] = useState("");
  const [materialChegou, setMaterialChegou] = useState<MaterialChegou>("Não");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitulo(servico.titulo);
      setDescricao(servico.descricao ?? "");
      setPrioridade(servico.prioridade);
      setDataInstalacao(toInputDate(servico.data_instalacao));
      setDataVencimentoSaldo(toInputDate(servico.data_vencimento_saldo));
      setFornecedorMaterial(servico.fornecedor_material ?? "");
      setMaterialChegou(servico.material_chegou ?? "Não");
      setObservacoes(servico.observacoes ?? "");
    }
  }, [open, servico]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error("Informe o título.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("servicos")
      .update({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        prioridade,
        data_instalacao: dataInstalacao || null,
        data_vencimento_saldo: dataVencimentoSaldo || null,
        fornecedor_material: fornecedorMaterial.trim() || null,
        material_chegou: materialChegou,
        observacoes: observacoes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", servico.id);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar serviço.");
      return;
    }

    toast.success("Serviço atualizado!");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select
              value={prioridade}
              onValueChange={(value) => setPrioridade(value as Prioridade)}
            >
              <SelectTrigger id="prioridade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_instalacao">Data de instalação</Label>
              <Input
                id="data_instalacao"
                type="date"
                value={dataInstalacao}
                onChange={(e) => setDataInstalacao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_vencimento_saldo">
                Vencimento do saldo
              </Label>
              <Input
                id="data_vencimento_saldo"
                type="date"
                value={dataVencimentoSaldo}
                onChange={(e) => setDataVencimentoSaldo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor_material">Fornecedor do material</Label>
            <Input
              id="fornecedor_material"
              value={fornecedorMaterial}
              onChange={(e) => setFornecedorMaterial(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material_chegou">Material já chegou</Label>
            <Select
              value={materialChegou}
              onValueChange={(value) =>
                setMaterialChegou(value as MaterialChegou)
              }
            >
              <SelectTrigger id="material_chegou">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
                <SelectItem value="A caminho">A caminho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
