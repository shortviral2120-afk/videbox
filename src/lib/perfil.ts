export interface PerfilEmpresa {
  nomeEmpresa: string;
  slogan: string;
  nomeResponsavel: string;
  telefone: string;
  email: string;
  cnpjCpf: string;
  endereco: string;
  cidade: string;
  logoBase64: string;
  percentualEntrada: number;
  moeda: string;
}

export const PERFIL_STORAGE_KEY = "vidrobox_perfil";

export const PERFIL_PADRAO: PerfilEmpresa = {
  nomeEmpresa: "VidroBox",
  slogan: "",
  nomeResponsavel: "",
  telefone: "",
  email: "",
  cnpjCpf: "",
  endereco: "",
  cidade: "",
  logoBase64: "",
  percentualEntrada: 70,
  moeda: "BRL",
};

export function loadPerfil(): PerfilEmpresa {
  if (typeof window === "undefined") return PERFIL_PADRAO;
  try {
    const raw = localStorage.getItem(PERFIL_STORAGE_KEY);
    if (!raw) return PERFIL_PADRAO;
    return { ...PERFIL_PADRAO, ...JSON.parse(raw) };
  } catch {
    return PERFIL_PADRAO;
  }
}

export function savePerfil(perfil: PerfilEmpresa) {
  localStorage.setItem(PERFIL_STORAGE_KEY, JSON.stringify(perfil));
}
