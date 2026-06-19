"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Servico } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageCircle, Copy, Send } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { toast } from "sonner";

interface Template {
  titulo: string;
  texto: string;
}

const TEMPLATES: Template[] = [
  {
    titulo: "Orçamento pronto",
    texto: "Olá [nome]! Seu orçamento está pronto. Valor: R$[valor]. Podemos agendar?",
  },
  {
    titulo: "Material chegou",
    texto: "Olá [nome]! O material do seu serviço chegou. Vamos agendar a instalação?",
  },
  {
    titulo: "Serviço concluído",
    texto: "Olá [nome]! Seu serviço foi concluído. Foi um prazer atendê-lo!",
  },
  {
    titulo: "Cobrança",
    texto: "Olá [nome], tudo bem? Passando para lembrar que temos um saldo de R$[saldo] em aberto.",
  },
];

export function WhatsappClient() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [numeros, setNumeros] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [cliRes, servRes] = await Promise.all([
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("servicos").select("*").order("created_at", { ascending: false }),
      ]);
      if (cliRes.data) setClientes(cliRes.data as Cliente[]);
      if (servRes.data) setServicos(servRes.data as unknown as Servico[]);
      setLoading(false);
    }
    load();
  }, []);

  function ultimoServico(clienteId: string) {
    return servicos.find((s) => s.cliente_id === clienteId) ?? null;
  }

  function saldoDevedorTotal(clienteId: string) {
    return servicos
      .filter((s) => s.cliente_id === clienteId)
      .reduce((sum, s) => sum + s.saldo_devedor, 0);
  }

  async function handleCopy(texto: string) {
    await navigator.clipboard.writeText(texto);
    toast.success("Mensagem copiada!");
  }

  function handleEnviarTemplate(template: Template) {
    const numero = numeros[template.titulo] ?? "";
    const url = buildWhatsAppLink(numero, template.texto);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <PageHeader title="WhatsApp" description="Contate seus clientes rapidamente" />

      <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning mb-6">
        Integração completa com API oficial do WhatsApp disponível em versão futura.
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="font-semibold mb-3">Clientes</h2>
          <div className="rounded-lg border bg-card overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : clientes.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nenhum cliente cadastrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Último serviço</TableHead>
                    <TableHead>Saldo devedor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => {
                    const ultimo = ultimoServico(c.id);
                    const saldo = saldoDevedorTotal(c.id);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell>{c.telefone ?? "-"}</TableCell>
                        <TableCell>{ultimo?.titulo ?? "-"}</TableCell>
                        <TableCell className={saldo > 0 ? "text-destructive font-medium" : ""}>
                          {formatCurrency(saldo)}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!c.telefone}
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() =>
                              window.open(
                                buildWhatsAppLink(c.telefone, `Olá ${c.nome}! Tudo bem?`),
                                "_blank"
                              )
                            }
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!c.telefone || saldo <= 0}
                            onClick={() =>
                              window.open(
                                buildWhatsAppLink(
                                  c.telefone,
                                  `Olá ${c.nome}, tudo bem? Passando para lembrar que temos um saldo de ${formatCurrency(saldo)} em aberto. Podemos combinar o pagamento?`
                                ),
                                "_blank"
                              )
                            }
                          >
                            Cobrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Mensagens rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <div key={template.titulo} className="rounded-lg border bg-card p-4 space-y-3">
                <p className="font-medium text-sm">{template.titulo}</p>
                <p className="text-sm text-muted-foreground">{template.texto}</p>
                <Input
                  placeholder="Número (opcional)"
                  value={numeros[template.titulo] ?? ""}
                  onChange={(e) =>
                    setNumeros((prev) => ({ ...prev, [template.titulo]: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(template.texto)}>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </Button>
                  <Button size="sm" onClick={() => handleEnviarTemplate(template)}>
                    <Send className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
