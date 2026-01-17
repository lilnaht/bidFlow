import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activity_log"]["Row"];
export type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type QuoteItemRow = Database["public"]["Tables"]["quote_items"]["Row"];
export type QuoteVersionRow = Database["public"]["Tables"]["quote_versions"]["Row"];
export type QuoteAcceptanceRow = Database["public"]["Tables"]["quote_acceptances"]["Row"];
export type QuoteEventRow = Database["public"]["Tables"]["quote_events"]["Row"];
export type RequestRow = Database["public"]["Tables"]["requests"]["Row"];
export type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
export type TemplateRow = Database["public"]["Tables"]["proposal_templates"]["Row"];
export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
export type RateLimitRow = Database["public"]["Tables"]["rate_limits"]["Row"];
export type InvoiceWithRelations = InvoiceRow & {
  quote: QuoteRow | null;
};

export type RequestWithClient = RequestRow & {
  client: ClientRow | null;
};

export type QuoteWithRelations = QuoteRow & {
  client: ClientRow | null;
  request: RequestRow | null;
};
export type QuoteWithItems = QuoteWithRelations & {
  items?: QuoteItemRow[];
};

export type ClientWithRelations = ClientRow & {
  requests?: RequestRow[];
  quotes?: QuoteRow[];
  contacts?: ContactRow[];
  tasks?: TaskRow[];
};

export type PublicQuotePayload = {
  quote: QuoteRow;
  client: ClientRow | null;
  items: QuoteItemRow[];
  settings: SettingsRow | null;
  attachments: AttachmentRow[];
};

export type TaskWithRelations = TaskRow & {
  client: ClientRow | null;
  request: RequestRow | null;
  quote: QuoteRow | null;
  assignee: ProfileRow | null;
};

const handleError = (error: { message: string } | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

export const fetchRequests = async () => {
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, client_id, name, email, whatsapp, project_type, description, budget_estimate, desired_deadline, status, source, created_at, updated_at, client:clients(id, name, email, phone, segment, status)"
    )
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as RequestWithClient[];
};

export const fetchRequestById = async (id: string) => {
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, client_id, name, email, whatsapp, project_type, description, budget_estimate, desired_deadline, status, source, created_at, updated_at, client:clients(id, name, email, phone, segment, status), quotes:quotes(id, client_id, request_id, title, amount_cents, currency, deadline_text, status, notes, created_at, updated_at)"
    )
    .eq("id", id)
    .single();

  handleError(error);
  return data as RequestWithClient & { quotes: QuoteRow[] };
};

export const fetchQuotes = async () => {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, client_id, request_id, title, amount_cents, currency, deadline_text, status, notes, public_token, public_expires_at, template_id, template_snapshot, discount_type, discount_percent, discount_quantity, created_at, updated_at, client:clients(id, name, email, phone), request:requests(id, client_id, name, email, whatsapp, project_type, description, budget_estimate, desired_deadline, status, source, created_at, updated_at)"
    )
    .order("updated_at", { ascending: false });

  handleError(error);
  return (data ?? []) as QuoteWithRelations[];
};

export const fetchQuoteById = async (id: string) => {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, client_id, request_id, title, amount_cents, currency, deadline_text, status, notes, public_token, public_expires_at, template_id, template_snapshot, discount_type, discount_percent, discount_quantity, created_at, updated_at, client:clients(id, name, email, phone, segment, status), request:requests(id, client_id, name, email, whatsapp, project_type, description, budget_estimate, desired_deadline, status, source, created_at, updated_at), items:quote_items(id, quote_id, service_id, title, description, quantity, unit_price_cents, sort_order, created_at, updated_at)"
    )
    .eq("id", id)
    .single();

  handleError(error);
  return data as QuoteWithItems;
};

export const fetchClients = async () => {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, segment, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  handleError(error);
  return (data ?? []) as ClientRow[];
};

export const fetchClientById = async (id: string) => {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, email, phone, segment, status, created_at, updated_at, requests:requests(id, client_id, name, email, whatsapp, project_type, description, budget_estimate, desired_deadline, status, source, created_at, updated_at), quotes:quotes(id, client_id, request_id, title, amount_cents, currency, deadline_text, status, notes, created_at, updated_at), contacts:contacts(id, client_id, name, email, phone, role, is_primary, created_at, updated_at), tasks:tasks(id, title, description, status, priority, due_at, assigned_to, created_by, task_type, auto_generated, created_at, updated_at)"
    )
    .eq("id", id)
    .single();

  handleError(error);
  return data as ClientWithRelations;
};

export const fetchSettings = async () => {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  handleError(error);
  return data as SettingsRow | null;
};

const findClientByContact = async (email?: string | null, phone?: string | null) => {
  if (!email && !phone) {
    return null;
  }

  let query = supabase.from("clients").select("*");

  if (email && phone) {
    query = query.or(`email.eq.${email},phone.eq.${phone}`);
  } else if (email) {
    query = query.eq("email", email);
  } else if (phone) {
    query = query.eq("phone", phone);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  handleError(error);
  return data as ClientRow | null;
};

export const upsertClientByContact = async (payload: {
  name: string;
  email?: string | null;
  phone?: string | null;
  segment?: string | null;
}) => {
  const existing = await findClientByContact(payload.email ?? null, payload.phone ?? null);

  if (existing) {
    const updates: Partial<ClientRow> = {};
    if (payload.name && payload.name !== existing.name) {
      updates.name = payload.name;
    }
    if (payload.email && payload.email !== existing.email) {
      updates.email = payload.email;
    }
    if (payload.phone && payload.phone !== existing.phone) {
      updates.phone = payload.phone;
    }
    if (payload.segment && payload.segment !== existing.segment) {
      updates.segment = payload.segment;
    }

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();
      handleError(error);
      return data as ClientRow;
    }

    return existing;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      segment: payload.segment ?? null,
      status: "negotiation",
    })
    .select()
    .single();

  handleError(error);
  return data as ClientRow;
};

export const createClient = async (payload: {
  name: string;
  email?: string | null;
  phone?: string | null;
  segment?: string | null;
  status?: Database["public"]["Enums"]["client_status"];
}) => {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      segment: payload.segment ?? null,
      status: payload.status ?? "negotiation",
    })
    .select()
    .single();

  handleError(error);
  return data as ClientRow;
};

export const createRequest = async (payload: {
  name: string;
  email?: string | null;
  whatsapp: string;
  projectType: string;
  description: string;
  budgetEstimate?: string | null;
  desiredDeadline?: string | null;
  source?: string;
  clientId?: string | null;
}) => {
  const { data, error } = await supabase
    .from("requests")
    .insert({
      client_id: payload.clientId ?? null,
      name: payload.name,
      email: payload.email ?? null,
      whatsapp: payload.whatsapp,
      project_type: payload.projectType,
      description: payload.description,
      budget_estimate: payload.budgetEstimate ?? null,
      desired_deadline: payload.desiredDeadline ?? null,
      status: "new",
      source: payload.source ?? "form",
    })
    .select()
    .single();

  handleError(error);
  return data as RequestRow;
};

export const createQuote = async (payload: {
  title: string;
  clientId: string | null;
  requestId?: string | null;
  amountCents: number;
  deadlineText?: string | null;
  status: Database["public"]["Enums"]["quote_status"];
  notes?: string | null;
  templateId?: string | null;
  templateSnapshot?: string | null;
  discountType?: Database["public"]["Enums"]["discount_type"] | null;
  discountPercent?: number;
  discountQuantity?: number;
}) => {
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      title: payload.title,
      client_id: payload.clientId ?? null,
      request_id: payload.requestId ?? null,
      amount_cents: payload.amountCents,
      deadline_text: payload.deadlineText ?? null,
      status: payload.status,
      notes: payload.notes ?? null,
      template_id: payload.templateId ?? null,
      template_snapshot: payload.templateSnapshot ?? null,
      discount_type: payload.discountType ?? null,
      discount_percent: payload.discountPercent ?? 0,
      discount_quantity: payload.discountQuantity ?? 0,
    })
    .select()
    .single();

  handleError(error);
  return data as QuoteRow;
};

export const updateRequestStatus = async (id: string, status: Database["public"]["Enums"]["request_status"]) => {
  const { data, error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  handleError(error);
  return data as RequestRow;
};

export const updateQuoteStatus = async (id: string, status: Database["public"]["Enums"]["quote_status"]) => {
  const { data, error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  handleError(error);
  return data as QuoteRow;
};

export const updateQuoteAmount = async (id: string, amountCents: number) => {
  const { data, error } = await supabase
    .from("quotes")
    .update({ amount_cents: amountCents })
    .eq("id", id)
    .select()
    .single();

  handleError(error);
  return data as QuoteRow;
};

export const updateQuotePricing = async (payload: {
  id: string;
  amountCents: number;
  discountType?: Database["public"]["Enums"]["discount_type"] | null;
  discountPercent?: number;
  discountQuantity?: number;
  templateId?: string | null;
  templateSnapshot?: string | null;
}) => {
  const { data, error } = await supabase
    .from("quotes")
    .update({
      amount_cents: payload.amountCents,
      discount_type: payload.discountType ?? null,
      discount_percent: payload.discountPercent ?? 0,
      discount_quantity: payload.discountQuantity ?? 0,
      template_id: payload.templateId ?? null,
      template_snapshot: payload.templateSnapshot ?? null,
    })
    .eq("id", payload.id)
    .select()
    .single();

  handleError(error);
  return data as QuoteRow;
};

export const updateClientStatus = async (id: string, status: Database["public"]["Enums"]["client_status"]) => {
  const { data, error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  handleError(error);
  return data as ClientRow;
};

export const upsertSettings = async (payload: Partial<SettingsRow>) => {
  const existing = await fetchSettings();

  if (existing) {
    const { data, error } = await supabase
      .from("settings")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    handleError(error);
    return data as SettingsRow;
  }

  const { data, error } = await supabase
    .from("settings")
    .insert(payload)
    .select()
    .single();

  handleError(error);
  return data as SettingsRow;
};

export const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, created_at, updated_at")
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as ProfileRow[];
};

export const updateUserRole = async (id: string, role: Database["public"]["Enums"]["user_role"]) => {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  handleError(error);
  return data as ProfileRow;
};

export const fetchContactsByClient = async (clientId: string) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, client_id, name, email, phone, role, is_primary, created_at, updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  handleError(error);
  return (data ?? []) as ContactRow[];
};

export const createContact = async (payload: {
  clientId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
}) => {
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      client_id: payload.clientId,
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      role: payload.role ?? null,
      is_primary: payload.isPrimary ?? false,
    })
    .select()
    .single();

  handleError(error);
  return data as ContactRow;
};

export const fetchQuoteItemsByQuote = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("quote_items")
    .select(
      "id, quote_id, service_id, title, description, quantity, unit_price_cents, sort_order, created_at, updated_at"
    )
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  handleError(error);
  return (data ?? []) as QuoteItemRow[];
};

export const createQuoteItems = async (items: Array<{
  quoteId: string;
  title: string;
  description?: string | null;
  quantity?: number;
  unitPriceCents?: number;
  sortOrder?: number;
  serviceId?: string | null;
}>) => {
  if (items.length === 0) {
    return [] as QuoteItemRow[];
  }

  const payload = items.map((item) => ({
    quote_id: item.quoteId,
    service_id: item.serviceId ?? null,
    title: item.title,
    description: item.description ?? null,
    quantity: item.quantity ?? 1,
    unit_price_cents: item.unitPriceCents ?? 0,
    sort_order: item.sortOrder ?? 0,
  }));

  const { data, error } = await supabase
    .from("quote_items")
    .insert(payload)
    .select();

  handleError(error);
  return (data ?? []) as QuoteItemRow[];
};

export const fetchTasks = async () => {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, due_at, client_id, request_id, quote_id, assigned_to, created_by, task_type, auto_generated, created_at, updated_at, client:clients(id, name), request:requests(id, name, project_type), quote:quotes(id, title), assignee:profiles!tasks_assigned_to_fkey(id, full_name, email)"
    )
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as TaskWithRelations[];
};

export const fetchTasksByEntity = async (payload: {
  clientId?: string | null;
  requestId?: string | null;
  quoteId?: string | null;
}) => {
  let query = supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, due_at, client_id, request_id, quote_id, assigned_to, created_by, task_type, auto_generated, created_at, updated_at, client:clients(id, name), request:requests(id, name, project_type), quote:quotes(id, title), assignee:profiles!tasks_assigned_to_fkey(id, full_name, email)"
    );

  if (payload.clientId) {
    query = query.eq("client_id", payload.clientId);
  }
  if (payload.requestId) {
    query = query.eq("request_id", payload.requestId);
  }
  if (payload.quoteId) {
    query = query.eq("quote_id", payload.quoteId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  handleError(error);
  return (data ?? []) as TaskWithRelations[];
};

export const createTask = async (payload: {
  title: string;
  description?: string | null;
  status?: Database["public"]["Enums"]["task_status"];
  priority?: Database["public"]["Enums"]["task_priority"];
  dueAt?: string | null;
  clientId?: string | null;
  requestId?: string | null;
  quoteId?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  taskType?: string;
  autoGenerated?: boolean;
}) => {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status ?? "todo",
      priority: payload.priority ?? "medium",
      due_at: payload.dueAt ?? null,
      client_id: payload.clientId ?? null,
      request_id: payload.requestId ?? null,
      quote_id: payload.quoteId ?? null,
      assigned_to: payload.assignedTo ?? null,
      created_by: payload.createdBy ?? null,
      task_type: payload.taskType ?? "general",
      auto_generated: payload.autoGenerated ?? false,
    })
    .select()
    .single();

  handleError(error);
  return data as TaskRow;
};

export const updateTaskStatus = async (id: string, status: Database["public"]["Enums"]["task_status"]) => {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  handleError(error);
  return data as TaskRow;
};

export const fetchActivityLog = async (entityType: Database["public"]["Enums"]["activity_entity"], entityId: string) => {
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, entity_type, entity_id, action, details, payload, actor_id, created_by, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as ActivityRow[];
};

export const createActivityLog = async (payload: {
  entityType: Database["public"]["Enums"]["activity_entity"];
  entityId: string;
  action: string;
  details?: Database["public"]["Tables"]["activity_log"]["Insert"]["details"];
  payload?: Database["public"]["Tables"]["activity_log"]["Insert"]["payload"];
  actorId?: string | null;
  createdBy?: string | null;
}) => {
  const { data, error } = await supabase
    .from("activity_log")
    .insert({
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      action: payload.action,
      details: payload.details ?? payload.payload ?? null,
      payload: payload.payload ?? payload.details ?? null,
      actor_id: payload.actorId ?? null,
      created_by: payload.createdBy ?? null,
    })
    .select()
    .single();

  handleError(error);
  return data as ActivityRow;
};

export const fetchAttachments = async (
  entityType: Database["public"]["Enums"]["activity_entity"],
  entityId: string
) => {
  const { data, error } = await supabase
    .from("attachments")
    .select(
      "id, entity_type, entity_id, bucket, storage_path, file_name, file_type, file_size, uploaded_by, created_at"
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as AttachmentRow[];
};

export const createAttachment = async (payload: {
  entityType: Database["public"]["Enums"]["activity_entity"];
  entityId: string;
  bucket?: string | null;
  storagePath: string;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedBy?: string | null;
}) => {
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      bucket: payload.bucket ?? "quote-attachments",
      storage_path: payload.storagePath,
      file_name: payload.fileName,
      file_type: payload.fileType ?? null,
      file_size: payload.fileSize ?? null,
      uploaded_by: payload.uploadedBy ?? null,
    })
    .select()
    .single();

  handleError(error);
  return data as AttachmentRow;
};

export const fetchTemplates = async () => {
  const { data, error } = await supabase
    .from("proposal_templates")
    .select("id, name, service_type, body, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as TemplateRow[];
};

export const createTemplate = async (payload: {
  name: string;
  serviceType?: string | null;
  body: string;
  isActive?: boolean;
}) => {
  const { data, error } = await supabase
    .from("proposal_templates")
    .insert({
      name: payload.name,
      service_type: payload.serviceType ?? null,
      body: payload.body,
      is_active: payload.isActive ?? true,
    })
    .select()
    .single();

  handleError(error);
  return data as TemplateRow;
};

export const updateTemplate = async (payload: {
  id: string;
  name?: string;
  serviceType?: string | null;
  body?: string;
  isActive?: boolean;
}) => {
  const { data, error } = await supabase
    .from("proposal_templates")
    .update({
      name: payload.name,
      service_type: payload.serviceType ?? null,
      body: payload.body,
      is_active: payload.isActive,
    })
    .eq("id", payload.id)
    .select()
    .single();

  handleError(error);
  return data as TemplateRow;
};

export const fetchServices = async () => {
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, unit, service_type, default_price_cents, default_deadline_text, is_active, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as ServiceRow[];
};

export const createService = async (payload: {
  name: string;
  description?: string | null;
  unit?: string | null;
  serviceType?: string | null;
  defaultPriceCents?: number;
  defaultDeadlineText?: string | null;
  isActive?: boolean;
}) => {
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit ?? null,
      service_type: payload.serviceType ?? null,
      default_price_cents: payload.defaultPriceCents ?? 0,
      default_deadline_text: payload.defaultDeadlineText ?? null,
      is_active: payload.isActive ?? true,
    })
    .select()
    .single();

  handleError(error);
  return data as ServiceRow;
};

export const updateService = async (payload: {
  id: string;
  name?: string;
  description?: string | null;
  unit?: string | null;
  serviceType?: string | null;
  defaultPriceCents?: number;
  defaultDeadlineText?: string | null;
  isActive?: boolean;
}) => {
  const { data, error } = await supabase
    .from("services")
    .update({
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit ?? null,
      service_type: payload.serviceType ?? null,
      default_price_cents: payload.defaultPriceCents,
      default_deadline_text: payload.defaultDeadlineText ?? null,
      is_active: payload.isActive,
    })
    .eq("id", payload.id)
    .select()
    .single();

  handleError(error);
  return data as ServiceRow;
};

export const fetchQuoteVersions = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("quote_versions")
    .select("id, quote_id, version, reason, snapshot, created_by, created_at")
    .eq("quote_id", quoteId)
    .order("version", { ascending: false });

  handleError(error);
  return (data ?? []) as QuoteVersionRow[];
};

export const createQuoteVersion = async (payload: {
  quoteId: string;
  reason?: string | null;
  createdBy?: string | null;
}) => {
  const { error } = await supabase.rpc("create_quote_version", {
    p_quote_id: payload.quoteId,
    p_reason: payload.reason ?? null,
    p_created_by: payload.createdBy ?? null,
  });

  handleError(error);
};

export const fetchQuoteAcceptances = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("quote_acceptances")
    .select("id, quote_id, status, name, comment, accepted_terms, ip, user_agent, created_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as QuoteAcceptanceRow[];
};

export const fetchQuoteEvents = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("quote_events")
    .select("id, quote_id, event_type, payload, ip, user_agent, created_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as QuoteEventRow[];
};

export const fetchInvoicesByQuote = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, quote_id, amount_cents, due_at, status, paid_at, external_id, payment_url, created_at, updated_at")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as InvoiceRow[];
};

export const fetchInvoices = async () => {
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, quote_id, amount_cents, due_at, status, paid_at, external_id, payment_url, created_at, updated_at, quote:quotes(id, title, client:clients(id, name, email))"
    )
    .order("created_at", { ascending: false });

  handleError(error);
  return (data ?? []) as InvoiceWithRelations[];
};

export const createInvoice = async (payload: {
  quoteId: string;
  amountCents: number;
  dueAt?: string | null;
  status?: Database["public"]["Enums"]["invoice_status"];
  paidAt?: string | null;
  externalId?: string | null;
  paymentUrl?: string | null;
}) => {
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      quote_id: payload.quoteId,
      amount_cents: payload.amountCents,
      due_at: payload.dueAt ?? null,
      status: payload.status ?? "pending",
      paid_at: payload.paidAt ?? null,
      external_id: payload.externalId ?? null,
      payment_url: payload.paymentUrl ?? null,
    })
    .select()
    .single();

  handleError(error);
  return data as InvoiceRow;
};

export const updateInvoice = async (payload: {
  id: string;
  amountCents?: number;
  dueAt?: string | null;
  status?: Database["public"]["Enums"]["invoice_status"];
  paidAt?: string | null;
  externalId?: string | null;
  paymentUrl?: string | null;
}) => {
  const { data, error } = await supabase
    .from("invoices")
    .update({
      amount_cents: payload.amountCents,
      due_at: payload.dueAt ?? null,
      status: payload.status,
      paid_at: payload.paidAt ?? null,
      external_id: payload.externalId ?? null,
      payment_url: payload.paymentUrl ?? null,
    })
    .eq("id", payload.id)
    .select()
    .single();

  handleError(error);
  return data as InvoiceRow;
};

export const fetchPublicQuote = async (token: string) => {
  const { data, error } = await supabase.rpc("get_public_quote", {
    p_token: token,
  });

  handleError(error);
  if (!data) {
    return null;
  }

  return data as PublicQuotePayload;
};
