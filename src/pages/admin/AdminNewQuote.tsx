import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  createClient,
  createActivityLog,
  createQuote,
  createQuoteItems,
  fetchClients,
  fetchServices,
  fetchTemplates,
  fetchRequests,
  updateQuotePricing,
  updateRequestStatus,
} from "@/integrations/supabase/queries";
import type { QuoteStatus, RequestStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2 } from "lucide-react";
import { renderTemplateSnapshot } from "@/lib/templates";
import { useSettings } from "@/hooks/use-settings";
import { calculateDiscountCents } from "@/lib/quote";
import { format } from "date-fns";

type QuoteItemForm = {
  title: string;
  description: string;
  quantity: string;
  unitPrice: string;
  serviceId: string;
};

type NewQuoteFormValues = {
  title: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientSegment: string;
  requestId: string;
  serviceType: string;
  templateId: string;
  discountType: "none" | "percent" | "quantity";
  discountValue: string;
  amount: string;
  deadlineText: string;
  status: QuoteStatus;
  notes: string;
  items: QuoteItemForm[];
};

const requestStatusByQuoteStatus: Record<QuoteStatus, RequestStatus> = {
  draft: "review",
  sent: "sent",
  approved: "approved",
  lost: "lost",
};

const AdminNewQuote = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestParam = searchParams.get("request");
  const { user } = useAuth();
  const { settings } = useSettings();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<NewQuoteFormValues>({
    defaultValues: {
      title: "",
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientSegment: "",
      requestId: "",
      serviceType: "general",
      templateId: "none",
      discountType: "none",
      discountValue: "",
      amount: "",
      deadlineText: "",
      status: "draft",
      notes: "",
      items: [
        {
          title: "",
          description: "",
          quantity: "1",
          unitPrice: "",
          serviceId: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const selectedClientId = watch("clientId");
  const selectedRequestId = watch("requestId");
  const watchedItems = watch("items");
  const selectedServiceType = watch("serviceType");
  const selectedTemplateId = watch("templateId");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");

  const activeServices = services.filter((service) => service.is_active);
  const availableTemplates = templates.filter((template) => {
    if (!template.is_active) {
      return false;
    }
    if (!selectedServiceType || selectedServiceType === "general") {
      return true;
    }
    return template.service_type === selectedServiceType;
  });

  const serviceTypeOptions = useMemo(() => {
    const types = new Set<string>();
    activeServices.forEach((service) => {
      if (service.service_type) {
        types.add(service.service_type);
      }
    });
    templates.forEach((template) => {
      if (template.service_type) {
        types.add(template.service_type);
      }
    });
    return Array.from(types);
  }, [activeServices, templates]);

  const itemsTotalCents = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const quantity = Number(item.quantity.replace(",", ".")) || 0;
      const unit = Number(item.unitPrice.replace(",", ".")) || 0;
      return sum + Math.round(quantity * unit * 100);
    }, 0);
  }, [watchedItems]);

  const discountCents = useMemo(() => {
    if (!discountType || discountType === "none") {
      return 0;
    }

    if (discountType === "percent") {
      const percent = Number(discountValue.replace(",", ".")) || 0;
      return calculateDiscountCents(itemsTotalCents, {
        discount_type: "percent",
        discount_percent: Math.min(Math.max(percent, 0), 100),
        discount_quantity: 0,
        amount_cents: 0,
      });
    }

    const amount = Number(discountValue.replace(",", ".")) || 0;
    return calculateDiscountCents(itemsTotalCents, {
      discount_type: "quantity",
      discount_percent: 0,
      discount_quantity: Math.round(amount * 100),
      amount_cents: 0,
    });
  }, [discountType, discountValue, itemsTotalCents]);

  const hasValidItems = watchedItems.some(
    (item) => item.title.trim() && Number(item.unitPrice.replace(",", ".")) > 0
  );

  useEffect(() => {
    if (requestParam) {
      setValue("requestId", requestParam);
    }
  }, [requestParam, setValue]);

  useEffect(() => {
    if (!selectedRequestId || selectedRequestId === "none") {
      return;
    }

    const request = requests.find((item) => item.id === selectedRequestId);
    if (request?.client?.id) {
      setValue("clientId", request.client.id);
      setValue("clientName", request.client.name ?? request.name);
    }
  }, [requests, selectedRequestId, setValue]);

  useEffect(() => {
    if (!selectedTemplateId || selectedTemplateId === "none") {
      return;
    }

    const template = templates.find((item) => item.id === selectedTemplateId);
    if (template?.service_type && !selectedServiceType) {
      setValue("serviceType", template.service_type);
    }
  }, [selectedTemplateId, selectedServiceType, setValue, templates]);

  useEffect(() => {
    if (!discountType || discountType === "none") {
      setValue("discountValue", "");
    }
  }, [discountType, setValue]);

  const handleAddService = () => {
    const service = activeServices.find((item) => item.id === selectedServiceId);
    if (!service) {
      return;
    }

    append({
      title: service.name,
      description: service.description ?? "",
      quantity: "1",
      unitPrice: (service.default_price_cents / 100).toString(),
      serviceId: service.id,
    });

    if (!watch("deadlineText") && service.default_deadline_text) {
      setValue("deadlineText", service.default_deadline_text);
    }
    if ((watch("serviceType") === "general" || !watch("serviceType")) && service.service_type) {
      setValue("serviceType", service.service_type);
    }
    setSelectedServiceId("");
  };

  const mutation = useMutation({
    mutationFn: async (values: NewQuoteFormValues) => {
      let clientId: string | null = values.clientId || null;

      if (values.clientId === "new") {
        if (!values.clientName) {
          throw new Error("Informe o nome do cliente.");
        }
        const createdClient = await createClient({
          name: values.clientName,
          email: values.clientEmail || null,
          phone: values.clientPhone || null,
          segment: values.clientSegment || null,
          status: "negotiation",
        });
        clientId = createdClient.id;
      }

      if (!clientId) {
        throw new Error("Selecione um cliente.");
      }

      const itemRows = values.items
        .filter(
          (item) => item.title.trim() && Number(item.unitPrice.replace(",", ".")) > 0
        )
        .map((item, index) => ({
          serviceId: item.serviceId || null,
          title: item.title,
          description: item.description || null,
          quantity: Number(item.quantity.replace(",", ".")) || 1,
          unitPriceCents: Math.round((Number(item.unitPrice.replace(",", ".")) || 0) * 100),
          sortOrder: index,
        }));

      const itemsTotal = itemRows.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceCents,
        0
      );

      const discountTypeValue =
        values.discountType && values.discountType !== "none" ? values.discountType : null;
      const discountPercent = discountTypeValue === "percent"
        ? Math.min(Math.max(Number(values.discountValue.replace(",", ".")) || 0, 0), 100)
        : 0;
      const discountQuantity = discountTypeValue === "quantity"
        ? Math.round((Number(values.discountValue.replace(",", ".")) || 0) * 100)
        : 0;
      const discountCents = itemsTotal > 0
        ? calculateDiscountCents(itemsTotal, {
            discount_type: discountTypeValue ?? null,
            discount_percent: discountPercent,
            discount_quantity: discountQuantity,
            amount_cents: 0,
          })
        : 0;

      const amountNumber = Number(values.amount.replace(",", "."));
      const fallbackAmount = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : 0;
      const amountCents = itemRows.length > 0 ? Math.max(0, itemsTotal - discountCents) : fallbackAmount;

      const requestId = values.requestId && values.requestId !== "none" ? values.requestId : null;
      const templateId = values.templateId && values.templateId !== "none" ? values.templateId : null;
      const quote = await createQuote({
        title: values.title,
        clientId,
        requestId,
        amountCents,
        deadlineText: values.deadlineText || null,
        status: values.status,
        notes: values.notes || null,
        templateId,
        discountType: discountTypeValue,
        discountPercent,
        discountQuantity,
      });

      if (itemRows.length > 0) {
        await createQuoteItems(
          itemRows.map((item) => ({
            quoteId: quote.id,
            serviceId: item.serviceId,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            sortOrder: item.sortOrder,
          }))
        );
      }

      const template = templates.find((item) => item.id === templateId);
      if (template?.body) {
        const validityDays = settings?.proposal_validity_days ?? 14;
        const validUntil = format(
          new Date(Date.now() + validityDays * 86400000),
          "dd/MM/yyyy"
        );
        const client = clients.find((item) => item.id === clientId) ?? null;
        const snapshotItems = itemRows.map((item) => ({
          id: "",
          quote_id: quote.id,
          service_id: item.serviceId,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price_cents: item.unitPriceCents,
          sort_order: item.sortOrder,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const templateSnapshot = renderTemplateSnapshot(template.body, {
          quote,
          client,
          items: snapshotItems,
          settings: settings ?? null,
          validUntil,
        });

        await updateQuotePricing({
          id: quote.id,
          amountCents,
          discountType: discountTypeValue,
          discountPercent,
          discountQuantity,
          templateId: template.id,
          templateSnapshot,
        });
      }

      if (requestId) {
        const nextStatus = requestStatusByQuoteStatus[values.status];
        await updateRequestStatus(requestId, nextStatus);
      }

      await createActivityLog({
        entityType: "quote",
        entityId: quote.id,
        action: "created",
        payload: { title: quote.title, amount_cents: quote.amount_cents },
        actorId: user?.id ?? null,
        createdBy: user?.id ?? null,
      }).catch(() => undefined);

      return quote;
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Orcamento criado",
        description: "A proposta foi registrada com sucesso.",
      });
      navigate(`/admin/orcamentos/${quote.id}`);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel criar o orcamento.";
      toast({
        title: "Erro ao criar proposta",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: NewQuoteFormValues) => {
    if (!values.title) {
      setError("title", { message: "Informe o titulo da proposta." });
      return;
    }
    if (!values.clientId) {
      setError("clientId", { message: "Selecione um cliente." });
      return;
    }
    if (values.clientId === "new" && !values.clientName) {
      setError("clientName", { message: "Informe o nome do cliente." });
      return;
    }
    const amountNumber = Number(values.amount.replace(",", "."));
    if (!hasValidItems && (!values.amount || !Number.isFinite(amountNumber) || amountNumber <= 0)) {
      setError("amount", { message: "Informe um valor valido." });
      return;
    }

    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Novo orcamento</h1>
          <p className="text-muted-foreground">
            Cadastre uma proposta e acompanhe o status de aprovacao.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/orcamentos">Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados da proposta</CardTitle>
          <CardDescription>Preencha as informacoes principais do orcamento</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Titulo</Label>
                <Input id="title" placeholder="Projeto ModaFit" {...register("title")} />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente</Label>
                <Controller
                  control={control}
                  name="clientId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="clientId">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo cliente</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.clientId && (
                  <p className="text-sm text-destructive">{errors.clientId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestId">Solicitacao vinculada (opcional)</Label>
                <Controller
                  control={control}
                  name="requestId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="requestId">
                        <SelectValue placeholder="Selecione a solicitacao" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {requests.map((request) => (
                          <SelectItem key={request.id} value={request.id}>
                            {request.name} - {request.project_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de servico</Label>
                <Controller
                  control={control}
                  name="serviceType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="serviceType">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Geral</SelectItem>
                        {serviceTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateId">Template de proposta</Label>
                <Controller
                  control={control}
                  name="templateId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="templateId">
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem template</SelectItem>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {selectedClientId === "new" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientName">Nome do cliente</Label>
                  <Input
                    id="clientName"
                    placeholder="Nome do cliente"
                    {...register("clientName")}
                  />
                  {errors.clientName && (
                    <p className="text-sm text-destructive">{errors.clientName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">E-mail</Label>
                  <Input id="clientEmail" placeholder="cliente@email.com" {...register("clientEmail")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefone</Label>
                  <Input id="clientPhone" placeholder="(11) 99999-9999" {...register("clientPhone")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientSegment">Segmento</Label>
                  <Input id="clientSegment" placeholder="Saude, Moda, Fintech..." {...register("clientSegment")} />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Itens do orcamento</h3>
                  <p className="text-sm text-muted-foreground">
                    Detalhe os servicos para calcular automaticamente o total.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      title: "",
                      description: "",
                      quantity: "1",
                      unitPrice: "",
                      serviceId: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Adicionar item
                </Button>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label>Adicionar do catalogo</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um servico" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddService}
                  disabled={!selectedServiceId}
                >
                  Adicionar servico
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Item {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {watchedItems[index]?.serviceId ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Catalogo:{" "}
                        {activeServices.find((service) => service.id === watchedItems[index]?.serviceId)?.name ??
                          "Servico selecionado"}
                      </p>
                    ) : null}
                    <input type="hidden" {...register(`items.${index}.serviceId`)} />
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`item-title-${index}`}>Titulo</Label>
                        <Input
                          id={`item-title-${index}`}
                          placeholder="Implementacao do site"
                          {...register(`items.${index}.title`)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`item-description-${index}`}>Descricao</Label>
                        <Textarea
                          id={`item-description-${index}`}
                          rows={2}
                          placeholder="Detalhes do servico"
                          {...register(`items.${index}.description`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item-quantity-${index}`}>Quantidade</Label>
                        <Input
                          id={`item-quantity-${index}`}
                          type="number"
                          step="1"
                          min="1"
                          {...register(`items.${index}.quantity`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item-price-${index}`}>Valor unitario (R$)</Label>
                        <Input
                          id={`item-price-${index}`}
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Subtotal:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(itemsTotalCents)}
                    </span>
                  </span>
                  {discountType !== "none" ? (
                    <span>
                      Desconto:{" "}
                      <span className="font-semibold text-foreground">
                        -{formatCurrency(discountCents)}
                      </span>
                    </span>
                  ) : null}
                  <span>
                    Total:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(Math.max(0, itemsTotalCents - discountCents))}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor total manual (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="12000"
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadlineText">Prazo</Label>
                <Input
                  id="deadlineText"
                  placeholder="Ex: 8 semanas"
                  {...register("deadlineText")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountType">Tipo de desconto</Label>
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="discountType">
                        <SelectValue placeholder="Sem desconto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem desconto</SelectItem>
                        <SelectItem value="percent">Percentual (%)</SelectItem>
                        <SelectItem value="quantity">Valor fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Valor do desconto</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    placeholder={discountType === "percent" ? "10" : "500"}
                    {...register("discountValue")}
                    disabled={discountType === "none"}
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status inicial</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Em edicao</SelectItem>
                        <SelectItem value="sent">Enviado</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes (opcional)</Label>
              <Textarea id="notes" rows={4} {...register("notes")} />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Criar orcamento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewQuote;
