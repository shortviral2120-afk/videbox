import { OrcamentoDetailClient } from "./orcamento-detail-client";

export default function OrcamentoDetailPage({ params }: { params: { id: string } }) {
  return <OrcamentoDetailClient id={params.id} />;
}
