import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Servico, ServicoItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: "#1A3A5C" },
  headerRowFlex: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  headerLeft: { flexDirection: "column", gap: 2, maxWidth: "60%" },
  headerRight: { flexDirection: "column", alignItems: "flex-end", gap: 2 },
  empresaNome: { fontSize: 18, fontWeight: 700, color: "#1A3A5C" },
  empresaInfo: { fontSize: 9, color: "#475569" },
  orcamentoMeta: { fontSize: 10, fontWeight: 700, color: "#1A3A5C" },
  divider: { borderBottomWidth: 1, borderColor: "#1A3A5C", marginVertical: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#1A3A5C", marginBottom: 6 },
  sectionRow: { fontSize: 9, marginBottom: 2 },
  label: { fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#1A3A5C", marginTop: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#cbd5e1" },
  headerRow: { backgroundColor: "#1A3A5C" },
  headerCellItem: { color: "#ffffff", fontWeight: 700, padding: 6, flex: 3, fontSize: 9 },
  headerCell: { color: "#ffffff", fontWeight: 700, padding: 6, flex: 1, fontSize: 9 },
  cellItem: { padding: 6, flex: 3, fontSize: 9 },
  cell: { padding: 6, flex: 1, fontSize: 9 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, marginTop: 6 },
  totalLabel: { fontWeight: 700, fontSize: 13, color: "#1A3A5C" },
  totalValue: { fontWeight: 700, fontSize: 13, color: "#1A3A5C" },
  footer: { marginTop: 24, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

export function OrcamentoPdfDocument({
  servico,
  itens,
  nomeEmpresa,
  slogan,
  telefoneEmpresa,
  enderecoEmpresa,
  cidadeEmpresa,
  cnpjEmpresa,
  percentualEntrada,
}: {
  servico: Servico;
  itens: ServicoItem[];
  nomeEmpresa?: string;
  slogan?: string;
  telefoneEmpresa?: string;
  enderecoEmpresa?: string;
  cidadeEmpresa?: string;
  cnpjEmpresa?: string;
  percentualEntrada?: number;
}) {
  const numeroOrcamento = servico.id.slice(0, 8).toUpperCase();
  const percentual = percentualEntrada ?? 70;
  const cliente = servico.clientes;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRowFlex}>
          <View style={styles.headerLeft}>
            <Text style={styles.empresaNome}>{nomeEmpresa || "VidroBox"}</Text>
            {slogan && <Text style={styles.empresaInfo}>{slogan}</Text>}
            {enderecoEmpresa && <Text style={styles.empresaInfo}>{enderecoEmpresa}</Text>}
            {(cidadeEmpresa || telefoneEmpresa) && (
              <Text style={styles.empresaInfo}>
                {[cidadeEmpresa, telefoneEmpresa].filter(Boolean).join(" · ")}
              </Text>
            )}
            {cnpjEmpresa && <Text style={styles.empresaInfo}>CNPJ: {cnpjEmpresa}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.orcamentoMeta}>N° Orçamento: {numeroOrcamento}</Text>
            <Text style={styles.orcamentoMeta}>Data: {formatDate(servico.data_orcamento)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>Nome: </Text>
          {cliente?.nome ?? "-"}
        </Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>CPF/CNPJ: </Text>
          {cliente?.cpf_cnpj || "Não informado"}
        </Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>Endereço: </Text>
          {cliente?.endereco || "Não informado"}
        </Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>Cidade: </Text>
          {cliente?.cidade || "Não informado"}
        </Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>Contato: </Text>
          {cliente?.telefone || "Não informado"}
        </Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>Validade da Proposta: </Text>
          {cliente?.validade_proposta ? formatDate(cliente.validade_proposta) : "Não especificada"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Produtos</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.headerCellItem}>Item</Text>
            <Text style={styles.headerCell}>Qtd</Text>
            <Text style={styles.headerCell}>Un. Med.</Text>
            <Text style={styles.headerCell}>V. Unit.</Text>
            <Text style={styles.headerCell}>Total</Text>
          </View>
          {itens.map((it) => {
            const temArea = it.preco_m2 > 0 && it.area_m2 > 0;
            const unidade = temArea ? "m²" : "un";
            const valorUnitario = temArea ? it.preco_m2 * it.area_m2 : it.valor_total;
            return (
              <View key={it.id} style={styles.row}>
                <Text style={styles.cellItem}>{it.descricao}</Text>
                <Text style={styles.cell}>{it.quantidade}</Text>
                <Text style={styles.cell}>{unidade}</Text>
                <Text style={styles.cell}>{formatCurrency(valorUnitario)}</Text>
                <Text style={styles.cell}>{formatCurrency(it.valor_total)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Preço Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(servico.valor_total)}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Pagamento</Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>Forma: </Text>
          Dinheiro, PIX, Débito, Crédito
        </Text>
        <Text style={styles.sectionRow}>
          <Text style={styles.label}>Condições: </Text>
          Para confirmação do pedido, é necessário o pagamento antecipado de {percentual}% do
          valor do serviço. O restante deverá ser quitado na entrega ou conclusão.
        </Text>

        <Text style={styles.footer}>Página 1 de 1</Text>
      </Page>
    </Document>
  );
}
