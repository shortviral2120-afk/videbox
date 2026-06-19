import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import type { Servico, ServicoItem } from "@/lib/types";
import { OrcamentoPdfDocument } from "./orcamento-pdf-document";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const nomeEmpresa = searchParams.get("nomeEmpresa") ?? undefined;
  const slogan = searchParams.get("slogan") ?? undefined;
  const telefoneEmpresa = searchParams.get("telefoneEmpresa") ?? undefined;
  const enderecoEmpresa = searchParams.get("enderecoEmpresa") ?? undefined;
  const cidadeEmpresa = searchParams.get("cidadeEmpresa") ?? undefined;
  const cnpjEmpresa = searchParams.get("cnpjEmpresa") ?? undefined;
  const percentualEntrada = Number(searchParams.get("percentualEntrada") ?? "70") || 70;

  const { data: servico } = await supabase
    .from("servicos")
    .select("*, clientes(nome, telefone, endereco, cidade, cpf_cnpj, validade_proposta)")
    .eq("id", params.id)
    .single();

  if (!servico) {
    return new Response("Serviço não encontrado", { status: 404 });
  }

  const { data: itens } = await supabase
    .from("servico_itens")
    .select("*")
    .eq("servico_id", params.id)
    .order("created_at");

  const buffer = await renderToBuffer(
    OrcamentoPdfDocument({
      servico: servico as unknown as Servico,
      itens: (itens ?? []) as unknown as ServicoItem[],
      nomeEmpresa,
      slogan,
      telefoneEmpresa,
      enderecoEmpresa,
      cidadeEmpresa,
      cnpjEmpresa,
      percentualEntrada,
    })
  );

  const clienteNome = (servico as unknown as Servico).clientes?.nome ?? "servico";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orcamento-${clienteNome.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
