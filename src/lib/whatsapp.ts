export function cleanPhone(telefone: string | null | undefined): string {
  const digits = (telefone ?? "").replace(/\D/g, "");
  return digits.length <= 11 ? `55${digits}` : digits;
}

export function buildWhatsAppLink(telefone: string | null | undefined, text?: string): string {
  const phone = cleanPhone(telefone);
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${query}`;
}
