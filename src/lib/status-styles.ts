import type { FaseServico, StatusPagamentoServico } from "./types";

export const statusClienteColor: Record<string, string> = {
  "Orçamento enviado": "bg-muted text-muted-foreground",
  Aprovado: "bg-blue-100 text-blue-700",
  "Aguardando obra": "bg-amber-100 text-amber-700",
  "Em execução": "bg-violet-100 text-violet-700",
  Concluído: "bg-success/10 text-success",
  Cancelado: "bg-destructive/10 text-destructive",
};

export const statusPagamentoServicoColor: Record<StatusPagamentoServico, string> = {
  "Aguardando entrada": "bg-muted text-muted-foreground",
  "Entrada recebida": "bg-blue-100 text-blue-700",
  Vencido: "bg-destructive/10 text-destructive",
  Quitado: "bg-success/10 text-success",
  Parcelado: "bg-blue-100 text-blue-700",
};

export const prioridadeColor: Record<string, string> = {
  Alta: "bg-destructive/10 text-destructive border-destructive/30",
  Média: "bg-warning/10 text-warning border-warning/30",
  Baixa: "bg-success/10 text-success border-success/30",
};

export const fasesServico: readonly FaseServico[] = [
  "Orçamento",
  "Aprovado",
  "Material encomendado",
  "Material chegou",
  "Instalação agendada",
  "Instalado",
  "Concluído",
] as const;

export const faseServicoColor: Record<FaseServico, string> = {
  Orçamento: "bg-muted text-muted-foreground",
  Aprovado: "bg-blue-100 text-blue-700",
  "Material encomendado": "bg-amber-100 text-amber-700",
  "Material chegou": "bg-amber-100 text-amber-700",
  "Instalação agendada": "bg-violet-100 text-violet-700",
  Instalado: "bg-violet-100 text-violet-700",
  Concluído: "bg-success/10 text-success",
};
