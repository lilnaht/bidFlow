import type { Database } from "@/integrations/supabase/types";

export type RequestStatus = Database["public"]["Enums"]["request_status"];
export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
export type ClientStatus = Database["public"]["Enums"]["client_status"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export const requestStatusLabels: Record<RequestStatus, string> = {
  new: "Novo",
  review: "Em analise",
  sent: "Enviado",
  approved: "Aprovado",
  lost: "Cancelado",
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "Em edicao",
  sent: "Enviado",
  approved: "Aprovado",
  lost: "Cancelado",
};

export const clientStatusLabels: Record<ClientStatus, string> = {
  active: "Ativo",
  negotiation: "Negociacao",
  inactive: "Inativo",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluida",
  blocked: "Bloqueada",
  canceled: "Cancelada",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
};

export const requestStatusStyles: Record<RequestStatus, string> = {
  new: "bg-status-new text-white",
  review: "bg-status-progress text-warning-foreground",
  sent: "bg-status-closed text-white",
  approved: "bg-status-converted text-white",
  lost: "bg-status-lost text-white",
};

export const quoteStatusStyles: Record<QuoteStatus, string> = {
  draft: "bg-status-progress text-warning-foreground",
  sent: "bg-status-closed text-white",
  approved: "bg-status-converted text-white",
  lost: "bg-status-lost text-white",
};

export const clientStatusStyles: Record<ClientStatus, string> = {
  active: "bg-status-converted text-white",
  negotiation: "bg-status-progress text-warning-foreground",
  inactive: "bg-status-closed text-white",
};

export const taskStatusStyles: Record<TaskStatus, string> = {
  todo: "bg-secondary text-foreground",
  doing: "bg-status-progress text-warning-foreground",
  done: "bg-status-converted text-white",
  blocked: "bg-status-lost text-white",
  canceled: "bg-status-lost text-white",
};
