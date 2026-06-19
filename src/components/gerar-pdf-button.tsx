"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { loadPerfil } from "@/lib/perfil";

export function GerarPdfButton({ servicoId }: { servicoId: string }) {
  function handleClick() {
    const perfil = loadPerfil();
    const params = new URLSearchParams();
    if (perfil.nomeEmpresa) params.set("nomeEmpresa", perfil.nomeEmpresa);
    if (perfil.telefone) params.set("telefoneEmpresa", perfil.telefone);
    const url = `/api/servicos/${servicoId}/pdf${params.toString() ? `?${params}` : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick}>
      <FileDown className="h-4 w-4" />
      Gerar PDF
    </Button>
  );
}
