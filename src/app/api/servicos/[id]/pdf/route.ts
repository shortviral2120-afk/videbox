import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import type { Servico, ServicoItem } from "@/lib/types";
import { OrcamentoPdfDocument } from "./orcamento-pdf-document";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: servico } = await supabase
    .from("servicos")
    .select("*, clientes(nome, telefone)")
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
