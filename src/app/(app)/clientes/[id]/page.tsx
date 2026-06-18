import { ClienteDetailClient } from "./cliente-detail-client";

export default function ClienteDetailPage({ params }: { params: { id: string } }) {
  return <ClienteDetailClient id={params.id} />;
}
