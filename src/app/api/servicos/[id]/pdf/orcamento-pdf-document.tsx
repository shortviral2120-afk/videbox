import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Servico, ServicoItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1A3A5C" },
  header: { fontSize: 22, fontWeight: 700, marginBottom: 2, color: "#1A3A5C" },
  sub: { fontSize: 11, marginBottom: 20, color: "#475569" },
  section: { marginBottom: 14, gap: 2 },
  label: { fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#1A3A5C", marginTop: 8 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#cbd5e1" },
  headerRow: { backgroundColor: "#1A3A5C" },
  headerCell: { color: "#ffffff", fontWeight: 700, padding: 6, flex: 1, fontSize: 9 },
  cell: { padding: 6, flex: 1, fontSize: 9 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", padding: 10, marginTop: 4 },
  totalText: { fontWeight: 700, fontSize: 14, color: "#1A3A5C" },
  footer: { marginTop: 28, fontSize: 9, color: "#64748b" },
});

export function OrcamentoPdfDocument({
  servico,
  itens,
}: {
  servico: Servico;
  itens: ServicoItem[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>VidroBox</Text>
        <Text style={styles.sub}>Orçamento de Serviço</Text>

        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Cliente: </Text>
            {servico.clientes?.nome ?? "-"}
          </Text>
          {servico.clientes?.telefone && (
            <Text>
              <Text style={styles.label}>Telefone: </Text>
              {servico.clientes.telefone}
            </Text>
          )}
          <Text>
            <Text style={styles.label}>Serviço: </Text>
            {servico.titulo}
          </Text>
          <Text>
            <Text style={styles.label}>Data do orçamento: </Text>
            {formatDate(servico.data_orcamento)}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.headerCell}>Descrição</Text>
            <Text style={styles.headerCell}>Material</Text>
            <Text style={styles.headerCell}>Larg. (m)</Text>
            <Text style={styles.headerCell}>Alt. (m)</Text>
            <Text style={styles.headerCell}>Área (m²)</Text>
            <Text style={styles.headerCell}>Preço/m²</Text>
            <Text style={styles.headerCell}>Qtd</Text>
            <Text style={styles.headerCell}>Total</Text>
          </View>
          {itens.map((it) => (
            <View key={it.id} style={styles.row}>
              <Text style={styles.cell}>{it.descricao}</Text>
              <Text style={styles.cell}>{it.material ?? "-"}</Text>
              <Text style={styles.cell}>{it.largura.toFixed(2)}</Text>
              <Text style={styles.cell}>{it.altura.toFixed(2)}</Text>
              <Text style={styles.cell}>{it.area_m2.toFixed(2)}</Text>
              <Text style={styles.cell}>{formatCurrency(it.preco_m2)}</Text>
              <Text style={styles.cell}>{it.quantidade}</Text>
              <Text style={styles.cell}>{formatCurrency(it.valor_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total: {formatCurrency(servico.valor_total)}</Text>
        </View>

        <Text style={styles.footer}>
          Este orçamento é válido por 30 dias a partir da data de emissão.
        </Text>
      </Page>
    </Document>
  );
}
