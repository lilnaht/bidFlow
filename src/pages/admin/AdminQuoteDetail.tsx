import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pdf } from "@react-pdf/renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  createAttachment,
  createActivityLog,
  createQuoteItems,
  createQuoteVersion,
  fetchAttachments,
  fetchActivityLog,
  fetchQuoteById,
  fetchQuoteAcceptances,
  fetchQuoteEvents,
  fetchQuoteVersions,
  updateQuotePricing,
  updateQuoteStatus,
} from "@/integrations/supabase/queries";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import { quoteStatusLabels, quoteStatusStyles, type QuoteStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/use-settings";
import QuotePdfDocument from "@/components/pdf/QuotePdf";
import { supabase } from "@/integrations/supabase/client";
import { calculateDiscountCents, calculateQuoteTotals } from "@/lib/quote";
import { Download, Link as LinkIcon, Upload } from "lucide-react";

type NewItemFormValues = {
  title: string;
  quantity: string;
  unitPrice: string;
};

const AdminQuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<QuoteStatus | "">("");
  const { user } = useAuth();
  const { settings } = useSettings();
  const [isGenerating, setIsGenerating] = useState(false);
  const [versionReason, setVersionReason] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewItemFormValues>({
    defaultValues: {
      title: "",
      quantity: "1",
      unitPrice: "",
    },
  });

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ["quotes", id],
    queryFn: () => fetchQuoteById(id as string),
    enabled: Boolean(id),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activity", "quote", id],
    queryFn: () => fetchActivityLog("quote", id as string),
    enabled: Boolean(id),
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ["attachments", "quote", id],
    queryFn: () => fetchAttachments("quote", id as string),
    enabled: Boolean(id),
  });

  const { data: acceptances = [] } = useQuery({
    queryKey: ["quote_acceptances", id],
    queryFn: () => fetchQuoteAcceptances(id as string),
    enabled: Boolean(id),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["quote_events", id],
    queryFn: () => fetchQuoteEvents(id as string),
    enabled: Boolean(id),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["quote_versions", id],
    queryFn: () => fetchQuoteVersions(id as string),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (quote?.status) {
      setStatus(quote.status);
    }
  }, [quote]);

  const totals = useMemo(() => {
    if (!quote) {
      return { itemsTotal: 0, discountCents: 0, totalCents: 0 };
    }
    return calculateQuoteTotals(quote.items ?? [], quote);
  }, [quote]);

  const handleDownloadPdf = async () => {
    if (!quote) {
      return;
    }

    try {
      setIsGenerating(true);
      const logoUrl =
        typeof window !== "undefined" ? `${window.location.origin}/logo2.png` : undefined;
      const doc = (
        <QuotePdfDocument quote={quote} settings={settings} logoUrl={logoUrl} />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orcamento-${quote.id.slice(0, 8).toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Nao foi possivel gerar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado",
        description: "O link publico foi copiado.",
      });
    } catch (error) {
      toast({
        title: "Nao foi possivel copiar",
        description: "Copie manualmente o link.",
        variant: "destructive",
      });
    }
  };

  const handleAttachmentOpen = async (attachment: typeof attachments[number]) => {
    try {
      const bucket = attachment.bucket || "quote-attachments";
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(attachment.storage_path, 300);
      if (error) {
        throw error;
      }
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener");
      }
    } catch (error) {
      toast({
        title: "Erro ao abrir anexo",
        description: "Nao foi possivel gerar o link do arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    uploadMutation.mutate(file);
    event.target.value = "";
  };

  const mutation = useMutation({
    mutationFn: (nextStatus: QuoteStatus) => updateQuoteStatus(id as string, nextStatus),
    onSuccess: (_data, nextStatus) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes", id] });
      queryClient.invalidateQueries({ queryKey: ["activity", "quote", id] });
      toast({
        title: "Status atualizado",
        description: "A proposta foi atualizada.",
      });
      if (quote) {
        createActivityLog({
          entityType: "quote",
          entityId: quote.id,
          action: "status_updated",
          payload: { status: nextStatus },
          actorId: user?.id ?? null,
          createdBy: user?.id ?? null,
        }).catch(() => undefined);
      }
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Nao foi possivel atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const itemMutation = useMutation({
    mutationFn: async (values: NewItemFormValues) => {
      const quantity = Number(values.quantity.replace(",", ".")) || 1;
      const unitPriceCents = Math.round((Number(values.unitPrice.replace(",", ".")) || 0) * 100);
      const items = await createQuoteItems([
        {
          quoteId: quote?.id as string,
          title: values.title,
          quantity,
          unitPriceCents,
          sortOrder: quote?.items?.length ?? 0,
        },
      ]);

      const currentItemsTotal = (quote?.items ?? []).reduce(
        (sum, item) => sum + item.quantity * item.unit_price_cents,
        0
      );
      const nextItemsTotal = currentItemsTotal + quantity * unitPriceCents;
      const discountCents = calculateDiscountCents(nextItemsTotal, {
        discount_type: quote?.discount_type ?? null,
        discount_percent: quote?.discount_percent ?? 0,
        discount_quantity: quote?.discount_quantity ?? 0,
        amount_cents: 0,
      });
      const nextTotal = Math.max(0, nextItemsTotal - discountCents);
      await updateQuotePricing({
        id: quote?.id as string,
        amountCents: nextTotal,
        discountType: quote?.discount_type ?? null,
        discountPercent: quote?.discount_percent ?? 0,
        discountQuantity: quote?.discount_quantity ?? 0,
        templateId: quote?.template_id ?? null,
        templateSnapshot: quote?.template_snapshot ?? null,
      });

      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quotes", id] });
      queryClient.invalidateQueries({ queryKey: ["activity", "quote", id] });
      toast({
        title: "Item adicionado",
        description: "O item foi incluido na proposta.",
      });
      if (quote) {
        createActivityLog({
          entityType: "quote",
          entityId: quote.id,
          action: "item_added",
          actorId: user?.id ?? null,
          createdBy: user?.id ?? null,
        }).catch(() => undefined);
      }
      reset({ title: "", quantity: "1", unitPrice: "" });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar item",
        description: "Nao foi possivel salvar o item.",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!quote) {
        throw new Error("Proposta nao carregada.");
      }
      const bucket = "quote-attachments";
      const safeName = file.name.replace(/[^\w.-]+/g, "-");
      const path = `quotes/${quote.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      return createAttachment({
        entityType: "quote",
        entityId: quote.id,
        bucket,
        storagePath: path,
        fileName: file.name,
        fileType: file.type || null,
        fileSize: file.size,
        uploadedBy: user?.id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", "quote", id] });
      toast({
        title: "Anexo enviado",
        description: "O arquivo foi anexado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar",
        description: "Nao foi possivel anexar o arquivo.",
        variant: "destructive",
      });
    },
  });

  const versionMutation = useMutation({
    mutationFn: async () => {
      if (!quote) {
        throw new Error("Proposta nao carregada.");
      }
      await createQuoteVersion({
        quoteId: quote.id,
        reason: versionReason || null,
        createdBy: user?.id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_versions", id] });
      toast({
        title: "Versao criada",
        description: "Snapshot registrado com sucesso.",
      });
      setVersionReason("");
    },
    onError: () => {
      toast({
        title: "Erro ao versionar",
        description: "Nao foi possivel criar a versao.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Carregando proposta...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Proposta</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar os detalhes da proposta.
        </p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Proposta</h1>
        <p className="text-sm text-muted-foreground">Proposta nao encontrada.</p>
      </div>
    );
  }

  const publicUrl =
    quote.public_token && typeof window !== "undefined"
      ? `${window.location.origin}/proposta/${quote.public_token}`
      : null;

  const selectedVersion =
    versions.find((version) => version.id === selectedVersionId) ?? null;
  const snapshot = selectedVersion?.snapshot as
    | { quote?: { amount_cents?: number; title?: string }; items?: Array<{ title?: string; quantity?: number; unit_price_cents?: number }> }
    | undefined;
  const snapshotItems = snapshot?.items ?? [];
  const snapshotTotal = snapshotItems.length > 0
    ? snapshotItems.reduce(
        (sum, item) => sum + (item.quantity ?? 0) * (item.unit_price_cents ?? 0),
        0
      )
    : snapshot?.quote?.amount_cents ?? 0;
  const snapshotDiff = snapshotTotal - totals.totalCents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Proposta</h1>
          <p className="text-muted-foreground">
            Atualizada {formatRelativeTime(quote.updated_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGenerating}>
            <Download className="h-4 w-4" />
            {isGenerating ? "Gerando..." : "Baixar PDF"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/orcamentos">Voltar</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{quote.title}</CardTitle>
          <CardDescription>Resumo do orcamento criado</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="text-base font-semibold text-foreground">
                {quote.client?.name ?? "Cliente nao informado"}
              </p>
              {quote.client?.id && (
                <Button asChild variant="ghost" size="sm" className="px-0">
                  <Link to={`/admin/clientes/${quote.client.id}`}>Ver cliente</Link>
                </Button>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-sm text-foreground">
                {formatCurrency(totals.totalCents)}
              </p>
              {quote.discount_type ? (
                <p className="text-xs text-muted-foreground">
                  Desconto aplicado: -{formatCurrency(totals.discountCents)}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prazo</p>
              <p className="text-sm text-foreground">
                {quote.deadline_text ? quote.deadline_text : "A definir"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="text-sm text-foreground">
                {quote.template_id ? "Template aplicado" : "Sem template"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Solicitacao</p>
              {quote.request?.id ? (
                <Button asChild variant="ghost" size="sm" className="px-0">
                  <Link to={`/admin/solicitacoes/${quote.request.id}`}>Ver solicitacao</Link>
                </Button>
              ) : (
                <p className="text-sm text-foreground">Nao vinculada</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Select value={status} onValueChange={(value) => setStatus(value as QuoteStatus)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Em edicao</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => status && mutation.mutate(status as QuoteStatus)}
                  disabled={!status || mutation.isPending}
                >
                  {mutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Badge className={cn("border-0", quoteStatusStyles[quote.status])}>
                  {quoteStatusLabels[quote.status]}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Link publico</p>
              {publicUrl ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(publicUrl)}
                  >
                    <LinkIcon className="h-4 w-4" />
                    Copiar link
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      Abrir pagina
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Defina o status como enviado para gerar o link.
                </p>
              )}
              {quote.public_expires_at ? (
                <p className="text-xs text-muted-foreground">
                  Expira em {formatDate(quote.public_expires_at)}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Observacoes</p>
              <p className="text-sm text-foreground">{quote.notes ?? "Sem observacoes."}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Itens da proposta</CardTitle>
          <CardDescription>Detalhamento e total calculado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quote.items && quote.items.length > 0 ? (
            <div className="space-y-3">
              {quote.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unit_price_cents)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Subtotal:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(totals.itemsTotal)}
                    </span>
                  </span>
                  {quote.discount_type ? (
                    <span>
                      Desconto:{" "}
                      <span className="font-semibold text-foreground">
                        -{formatCurrency(totals.discountCents)}
                      </span>
                    </span>
                  ) : null}
                  <span>
                    Total:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(totals.totalCents)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum item detalhado. Cadastre itens para calcular o total automaticamente.
            </div>
          )}

          <form onSubmit={handleSubmit((values) => itemMutation.mutate(values))} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-item-title">Titulo</Label>
              <Input
                id="new-item-title"
                placeholder="Pacote de implementacao"
                {...register("title", { required: true })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">Informe o titulo do item.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-item-quantity">Quantidade</Label>
              <Input
                id="new-item-quantity"
                type="number"
                step="1"
                min="1"
                {...register("quantity")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-item-price">Valor unitario (R$)</Label>
              <Input
                id="new-item-price"
                type="number"
                step="0.01"
                {...register("unitPrice", { required: true })}
              />
              {errors.unitPrice && (
                <p className="text-sm text-destructive">Informe o valor.</p>
              )}
            </div>
            <div className="flex items-end md:col-span-4">
              <Button type="submit" disabled={itemMutation.isPending}>
                {itemMutation.isPending ? "Salvando..." : "Adicionar item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Anexos</CardTitle>
            <CardDescription>Envie contratos, referencias e arquivos de apoio.</CardDescription>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-4 w-4" />
              {uploadMutation.isPending ? "Enviando..." : "Adicionar arquivo"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {attachments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum anexo enviado ainda.
            </div>
          ) : (
            attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.file_type ?? "Arquivo"} •{" "}
                    {attachment.file_size ? `${Math.round(attachment.file_size / 1024)} KB` : "Tamanho desconhecido"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAttachmentOpen(attachment)}
                >
                  Visualizar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {quote.template_snapshot ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Template aplicado</CardTitle>
            <CardDescription>Snapshot do conteudo enviado ao cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-foreground whitespace-pre-line">
              {quote.template_snapshot}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Versoes do orcamento</CardTitle>
          <CardDescription>Crie snapshots para comparar mudancas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="version-reason">Motivo (opcional)</Label>
              <Input
                id="version-reason"
                value={versionReason}
                onChange={(event) => setVersionReason(event.target.value)}
                placeholder="Ajuste de escopo ou desconto"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => versionMutation.mutate()}
              disabled={versionMutation.isPending}
            >
              {versionMutation.isPending ? "Salvando..." : "Criar versao"}
            </Button>
          </div>

          {versions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhuma versao registrada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">Versao {version.version}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(version.created_at)}{" "}
                      {version.reason ? `• ${version.reason}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVersionId(version.id)}
                  >
                    Ver snapshot
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedVersion ? (
            <div className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
              <p className="text-sm font-semibold text-foreground">
                Snapshot v{selectedVersion.version}
              </p>
              <p className="text-xs text-muted-foreground">
                Total na versao: {formatCurrency(snapshotTotal)} • Diferenca{" "}
                {snapshotDiff >= 0 ? "+" : ""}
                {formatCurrency(snapshotDiff)}
              </p>
              <div className="mt-2 space-y-1">
                {snapshotItems.length === 0 ? (
                  <p>Nenhum item registrado na versao.</p>
                ) : (
                  snapshotItems.map((item, index) => (
                    <p key={`${selectedVersion.id}-${index}`}>
                      {item.title ?? "Item"} • {item.quantity ?? 0} x{" "}
                      {formatCurrency(item.unit_price_cents ?? 0)}
                    </p>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Aceites e eventos</CardTitle>
          <CardDescription>Registro de aprovacoes, recusas e acessos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Aceites</p>
            {acceptances.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                Nenhum aceite registrado.
              </div>
            ) : (
              acceptances.map((acceptance) => (
                <div key={acceptance.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{acceptance.name}</p>
                    <Badge variant="secondary">{acceptance.status}</Badge>
                  </div>
                  {acceptance.comment ? (
                    <p className="text-xs text-muted-foreground">{acceptance.comment}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(acceptance.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Eventos</p>
            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                Nenhum evento registrado.
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{event.event_type}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(event.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Atividades recentes</CardTitle>
          <CardDescription>Registro das principais atualizacoes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhuma atividade registrada.
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">{activity.action}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuoteDetail;
