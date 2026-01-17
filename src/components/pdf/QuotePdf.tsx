import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { SettingsRow, QuoteWithItems } from "@/integrations/supabase/queries";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";

type QuotePdfProps = {
  quote: QuoteWithItems;
  settings: SettingsRow | null;
  logoUrl?: string | null;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 32,
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  brandInfo: {
    marginTop: 4,
    color: "#475569",
  },
  titleBlock: {
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  docMeta: {
    marginTop: 4,
    color: "#475569",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 24,
  },
  col: {
    flexGrow: 1,
  },
  label: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  colItem: { flexGrow: 3 },
  colQty: { width: 40, textAlign: "right" },
  colUnit: { width: 80, textAlign: "right" },
  colTotal: { width: 90, textAlign: "right" },
  totalBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    alignSelf: "flex-end",
    minWidth: 200,
  },
  totalLabel: {
    fontSize: 9,
    color: "#e2e8f0",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 700,
  },
  notes: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    marginTop: 24,
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
  },
});

const QuotePdfDocument = ({ quote, settings, logoUrl }: QuotePdfProps) => {
  const items = quote.items ?? [];
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0
  );
  const totalCents = items.length > 0 ? itemsTotal : quote.amount_cents;
  const createdAt = quote.created_at ? format(new Date(quote.created_at), "dd/MM/yyyy") : "-";
  const validityDays = settings?.proposal_validity_days ?? 14;
  const validUntil = quote.created_at
    ? format(new Date(new Date(quote.created_at).getTime() + validityDays * 86400000), "dd/MM/yyyy")
    : "-";

  const companyName = settings?.company_name ?? "bidFlow";
  const companyEmail = settings?.company_email ?? "contato@bidflow.com";
  const companyPhone = settings?.company_phone ?? "(11) 99999-9999";
  const companyAddress = settings?.company_address ?? "Sao Paulo, SP";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
            <View>
              <Text style={styles.brandTitle}>{companyName}</Text>
              <Text style={styles.brandInfo}>{companyEmail}</Text>
              <Text style={styles.brandInfo}>{companyPhone}</Text>
              <Text style={styles.brandInfo}>{companyAddress}</Text>
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>Proposta Comercial</Text>
            <Text style={styles.docMeta}>ID {quote.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.docMeta}>Emissao: {createdAt}</Text>
            <Text style={styles.docMeta}>Validade: {validUntil}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.grid}>
            <View style={styles.col}>
              <Text style={styles.label}>Nome</Text>
              <Text style={styles.value}>{quote.client?.name ?? "Cliente nao informado"}</Text>
              <Text style={styles.label}>E-mail</Text>
              <Text style={styles.value}>{quote.client?.email ?? "-"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Telefone</Text>
              <Text style={styles.value}>{quote.client?.phone ?? "-"}</Text>
              <Text style={styles.label}>Projeto</Text>
              <Text style={styles.value}>{quote.title}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do orcamento</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Item</Text>
            <Text style={styles.colQty}>Qtd</Text>
            <Text style={styles.colUnit}>Valor</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.colItem}>Servico principal</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colUnit}>{formatCurrency(totalCents)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(totalCents)}</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colItem}>{item.title}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnit}>{formatCurrency(item.unit_price_cents)}</Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(item.unit_price_cents * item.quantity)}
                </Text>
              </View>
            ))
          )}

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalCents)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observacoes</Text>
          <Text style={styles.notes}>
            {quote.notes ?? "Valores validos conforme a proposta. Servicos adicionais podem ser orcados separadamente."}
          </Text>
        </View>

        <Text style={styles.footer}>
          {companyName} - {companyEmail} - {companyPhone}
        </Text>
      </Page>
    </Document>
  );
};

export default QuotePdfDocument;
