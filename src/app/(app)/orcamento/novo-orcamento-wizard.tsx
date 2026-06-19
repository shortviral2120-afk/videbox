"use client";

import { useEffect, useState } from "react";
import { addDays } from "date-fns";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Cliente, ComoChegou } from "@/lib/types";
import { formatCurrency, toInputDate } from "@/lib/utils";
import { NovoItemWizardDialog, type WizardItem } from "./novo-item-wizard-dialog";

const NONE_VALUE = "__none__";

const COMO_CHEGOU: ComoChegou[] = [
  "Instagram",
  "Indicação",
  "Google",
  "Passou na frente",
  "WhatsApp",
  "Outros",
];

function emptyNovoClienteForm() {
  return {
    nome: "",
    telefone: "",
    como_chegou: "" as ComoChegou | "",
    endereco: "",
    cidade: "",
    cpf_cnpj: "",
  };
}

export function NovoOrcamentoWizard({
  open,
  onOpenChange,
  clientes,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  onCreated: (servicoId: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [clienteMode, setClienteMode] = useState<"novo" | "existente">("novo");
  const [novoClienteForm, setNovoClienteForm] = useState(emptyNovoClienteForm());
  const [clienteExistenteId, setClienteExistenteId] = useState("");
  const [dataOrcamento, setDataOrcamento] = useState("");
  const [validadeProposta, setValidadeProposta] = useState("");
  const [tituloServico, setTituloServico] = useState("");
  const [itens, setItens] = useState<WizardItem[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setClienteMode("novo");
      setNovoClienteForm(emptyNovoClienteForm());
      setClienteExistenteId("");
      setDataOrcamento(toInputDate(new Date()));
      setValidadeProposta(toInputDate(addDays(new Date(), 30)));
      setTituloServico("");
      setItens([]);
      setItemDialogOpen(false);
      setSubmitting(false);
    }
  }, [open]);

  const clienteSelecionado = clientes.find((c) => c.id === clienteExistenteId) ?? null;
  const totalGeral = itens.reduce((sum, it) => sum + it.valor_total, 0);

  function handleProximo() {
    if (clienteMode === "novo") {
      if (!novoClienteForm.nome.trim()) {
        toast.error("Informe o nome do cliente.");
        return;
      }
    } else if (!clienteExistenteId) {
      toast.error("Selecione um cliente.");
      return;
    }
    setStep(2);
  }

  function handleRemoveItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCriarOrcamento() {
    if (!tituloServico.trim()) {
      toast.error("Informe o título do serviço.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    let clienteId = clienteExistenteId;

    if (clienteMode === "novo") {
      if (!novoClienteForm.nome.trim()) {
        toast.error("Informe o nome do cliente.");
        setSubmitting(false);
        return;
      }
      try {
        const { data: novoCliente, error } = await supabase
          .from("clientes")
          .insert({
            nome: novoClienteForm.nome.trim(),
            telefone: novoClienteForm.telefone || null,
            como_chegou: novoClienteForm.como_chegou || null,
            endereco: novoClienteForm.endereco || null,
            cidade: novoClienteForm.cidade || null,
            cpf_cnpj: novoClienteForm.cpf_cnpj || null,
            data_orcamento: dataOrcamento || null,
            validade_proposta: validadeProposta || null,
          })
          .select()
          .single();
        if (error || !novoCliente) throw error;
        clienteId = novoCliente.id;
      } catch {
        toast.error("Erro ao cadastrar cliente.");
        setSubmitting(false);
        return;
      }
    } else if (!clienteId) {
      toast.error("Selecione um cliente.");
      setSubmitting(false);
      return;
    }

    const totalGeralFinal = itens.reduce((sum, it) => sum + it.valor_total, 0);
    let servicoId: string;
    try {
      const { data: novoServico, error } = await supabase
        .from("servicos")
        .insert({
          cliente_id: clienteId,
          titulo: tituloServico.trim(),
          fase: "Orçamento",
          status_pagamento: "Aguardando entrada",
          data_orcamento: dataOrcamento || null,
          valor_total: totalGeralFinal,
          valor_entrada: 0,
        })
        .select()
        .single();
      if (error || !novoServico) throw error;
      servicoId = novoServico.id;
    } catch {
      toast.error("Erro ao criar o serviço.");
      setSubmitting(false);
      return;
    }

    if (itens.length > 0) {
      try {
        const { error } = await supabase.from("servico_itens").insert(
          itens.map((it) => ({
            servico_id: servicoId,
            descricao: it.descricao,
            tipo_produto: it.tipo_produto,
            material: it.material,
            largura: it.largura,
            altura: it.altura,
            largura_original: it.largura_original,
            altura_original: it.altura_original,
            preco_m2: it.preco_m2,
            quantidade: it.quantidade,
            observacao: it.observacao,
          }))
        );
        if (error) throw error;
      } catch {
        toast.error("Serviço criado, mas houve erro ao salvar os itens.");
        setSubmitting(false);
        onCreated(servicoId);
        onOpenChange(false);
        return;
      }
    }

    toast.success("Orçamento criado com sucesso!");
    setSubmitting(false);
    onCreated(servicoId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Novo Orçamento — Etapa 1 de 2: Dados do Cliente"
              : "Novo Orçamento — Etapa 2 de 2: Itens do Orçamento"}
          </DialogTitle>
        </DialogHeader>

        <Progress value={step === 1 ? 50 : 100} />

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={clienteMode === "novo" ? "default" : "outline"}
                onClick={() => setClienteMode("novo")}
              >
                Registrar novo cliente
              </Button>
              <Button
                type="button"
                variant={clienteMode === "existente" ? "default" : "outline"}
                onClick={() => setClienteMode("existente")}
              >
                Selecionar cliente existente
              </Button>
            </div>

            {clienteMode === "novo" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={novoClienteForm.nome}
                    onChange={(e) =>
                      setNovoClienteForm((f) => ({ ...f, nome: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={novoClienteForm.telefone}
                      onChange={(e) =>
                        setNovoClienteForm((f) => ({ ...f, telefone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Como chegou</Label>
                    <Select
                      value={novoClienteForm.como_chegou || NONE_VALUE}
                      onValueChange={(v) =>
                        setNovoClienteForm((f) => ({
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
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={novoClienteForm.endereco}
                    onChange={(e) =>
                      setNovoClienteForm((f) => ({ ...f, endereco: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={novoClienteForm.cidade}
                      onChange={(e) =>
                        setNovoClienteForm((f) => ({ ...f, cidade: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpf_cnpj"
                      value={novoClienteForm.cpf_cnpj}
                      onChange={(e) =>
                        setNovoClienteForm((f) => ({ ...f, cpf_cnpj: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={clienteExistenteId} onValueChange={setClienteExistenteId}>
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

                {clienteSelecionado && (
                  <div className="rounded-lg border bg-card p-3 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nome: </span>
                      {clienteSelecionado.nome}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Telefone: </span>
                      {clienteSelecionado.telefone ?? "-"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Endereço: </span>
                      {clienteSelecionado.endereco ?? "-"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Cidade: </span>
                      {clienteSelecionado.cidade ?? "-"}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_orcamento">Data do orçamento</Label>
                <Input
                  id="data_orcamento"
                  type="date"
                  value={dataOrcamento}
                  onChange={(e) => setDataOrcamento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validade_proposta">Validade da proposta</Label>
                <Input
                  id="validade_proposta"
                  type="date"
                  value={validadeProposta}
                  onChange={(e) => setValidadeProposta(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo_servico">Título do serviço *</Label>
              <Input
                id="titulo_servico"
                value={tituloServico}
                onChange={(e) => setTituloServico(e.target.value)}
                placeholder="Box banheiro, Janela sala..."
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setItemDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </div>

            <div className="rounded-lg border bg-card overflow-x-auto">
              {itens.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum item adicionado ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Largura aj. (m)</TableHead>
                      <TableHead>Altura aj. (m)</TableHead>
                      <TableHead>Área (m²)</TableHead>
                      <TableHead>Preço/m²</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((it, index) => (
                      <TableRow key={index}>
                        <TableCell>{it.tipo_produto}</TableCell>
                        <TableCell className="font-medium">{it.descricao}</TableCell>
                        <TableCell>{it.material ?? "-"}</TableCell>
                        <TableCell>{it.largura.toFixed(2)}</TableCell>
                        <TableCell>{it.altura.toFixed(2)}</TableCell>
                        <TableCell>{it.area_m2.toFixed(2)}</TableCell>
                        <TableCell>{formatCurrency(it.preco_m2)}</TableCell>
                        <TableCell>{it.quantidade}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(it.valor_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                      <TableCell colSpan={8} className="text-right font-semibold">
                        Total geral
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(totalGeral)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleProximo}>
                Próximo →
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                ← Voltar
              </Button>
              <Button
                type="button"
                className="bg-primary"
                disabled={submitting}
                onClick={handleCriarOrcamento}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar Orçamento
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <NovoItemWizardDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        onAdd={(item) => setItens((prev) => [...prev, item])}
      />
    </Dialog>
  );
}
