import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

export const formatCurrency = (amountCents?: number | null) => {
  const amount = typeof amountCents === "number" ? amountCents / 100 : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatRelativeTime = (date?: string | null) => {
  if (!date) {
    return "-";
  }

  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  });
};

export const formatDate = (date?: string | null, pattern = "dd/MM/yyyy") => {
  if (!date) {
    return "-";
  }

  return format(new Date(date), pattern);
};
