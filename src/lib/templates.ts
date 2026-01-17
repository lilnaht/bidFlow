import type { ClientRow, QuoteItemRow, QuoteRow, SettingsRow } from "@/integrations/supabase/queries";
import { formatCurrency } from "@/lib/format";
import { calculateQuoteTotals } from "@/lib/quote";

type TemplateContext = {
  quote: QuoteRow;
  client: ClientRow | null;
  items: QuoteItemRow[];
  settings: SettingsRow | null;
  validUntil?: string | null;
};

const defaultItemsTable = (items: QuoteItemRow[]) => {
  if (!items.length) {
    return "- Item principal (1 x " + formatCurrency(0) + ")";
  }

  return items
    .map((item) => {
      const lineTotal = item.quantity * item.unit_price_cents;
      return `- ${item.title} (${item.quantity} x ${formatCurrency(item.unit_price_cents)}) = ${formatCurrency(lineTotal)}`;
    })
    .join("\n");
};

export const renderTemplateSnapshot = (body: string, context: TemplateContext) => {
  const { quote, client, items, settings, validUntil } = context;
  const totals = calculateQuoteTotals(items, quote);
  const values: Record<string, string> = {
    client_name: client?.name ?? "Cliente",
    client_email: client?.email ?? "-",
    client_phone: client?.phone ?? "-",
    company_name: settings?.company_name ?? "bidFlow",
    company_email: settings?.company_email ?? "-",
    company_phone: settings?.company_phone ?? "-",
    company_address: settings?.company_address ?? "-",
    quote_title: quote.title,
    quote_id: quote.id,
    quote_total: formatCurrency(totals.totalCents),
    quote_subtotal: formatCurrency(totals.itemsTotal),
    quote_discount: formatCurrency(totals.discountCents),
    valid_until: validUntil ?? "-",
    items_table: defaultItemsTable(items),
    notes: quote.notes ?? "",
  };

  return body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => {
    const value = values[key];
    return value !== undefined ? value : "";
  });
};
