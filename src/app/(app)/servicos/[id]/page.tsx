import { ServicoDetailClient } from "./servico-detail-client";

export default function ServicoDetailPage({ params }: { params: { id: string } }) {
  return <ServicoDetailClient id={params.id} />;
}
