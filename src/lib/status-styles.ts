export const statusClienteColor: Record<string, string> = {
  "Orçamento enviado": "bg-muted text-muted-foreground",
  Aprovado: "bg-blue-100 text-blue-700",
  "Aguardando obra": "bg-amber-100 text-amber-700",
  "Em execução": "bg-violet-100 text-violet-700",
  Concluído: "bg-success/10 text-success",
  Cancelado: "bg-destructive/10 text-destructive",
};

export const statusPagamentoColor: Record<string, string> = {
  "Em dia": "bg-warning/10 text-warning",
  Vencido: "bg-destructive/10 text-destructive",
  Quitado: "bg-success/10 text-success",
  Parcelado: "bg-blue-100 text-blue-700",
  "Aguardando entrada": "bg-muted text-muted-foreground",
};

export const prioridadeColor: Record<string, string> = {
  Alta: "bg-destructive/10 text-destructive border-destructive/30",
  Média: "bg-warning/10 text-warning border-warning/30",
  Baixa: "bg-success/10 text-success border-success/30",
};

export const fasesCronograma = [
  "Novo orçamento",
  "Aguardando material",
  "Agendado",
  "Em execução",
  "Concluído",
] as const;
