import { PageHeader } from "@/components/page-header";
import { CaixaClient } from "./caixa-client";

export default function CaixaPage() {
  return (
    <>
      <PageHeader
        title="Fluxo de Caixa"
        description="Acompanhe entradas, saídas e saldos por banco"
      />
      <CaixaClient />
    </>
  );
}
