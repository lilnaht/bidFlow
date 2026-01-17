import type { QuoteItemRow, QuoteRow } from "@/integrations/supabase/queries";

type QuoteDiscount = Pick<
  QuoteRow,
  "discount_type" | "discount_percent" | "discount_quantity" | "amount_cents"
>;

export const calculateItemsTotal = (items: QuoteItemRow[] = []) => {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0);
};

export const calculateDiscountCents = (
  itemsTotal: number,
  discount: QuoteDiscount
) => {
  if (!discount.discount_type || itemsTotal <= 0) {
    return 0;
  }

  if (discount.discount_type === "percent") {
    const percent = Math.min(Math.max(discount.discount_percent ?? 0, 0), 100);
    return Math.round((itemsTotal * percent) / 100);
  }

  const fixed = Math.max(discount.discount_quantity ?? 0, 0);
  return Math.min(fixed, itemsTotal);
};

export const calculateQuoteTotals = (items: QuoteItemRow[] = [], quote: QuoteDiscount) => {
  const itemsTotal = calculateItemsTotal(items);
  const discountCents = calculateDiscountCents(itemsTotal, quote);
  const totalCents = items.length > 0
    ? Math.max(0, itemsTotal - discountCents)
    : quote.amount_cents ?? 0;

  return { itemsTotal, discountCents, totalCents };
};
