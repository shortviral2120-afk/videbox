export function ajustarMedida(valor: number): { ajustado: number; folgaCm: number } {
  const folgaCm = valor > 1.5 ? 10 : 5;
  const ajustado = Math.round((valor + folgaCm / 100) * 100) / 100;
  return { ajustado, folgaCm };
}
