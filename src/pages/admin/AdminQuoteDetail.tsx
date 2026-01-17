import { useEffect, useMemo, useState } from "react";
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
  createActivityLog,
  createQuoteItems,
  fetchActivityLog,
  fetchQuoteById,
  updateQuoteAmount,
  updateQuoteStatus,
} from "@/integrations/supabase/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { quoteStatusLabels, quoteStatusStyles, type QuoteStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/use-settings";
import QuotePdfDocument from "@/components/pdf/QuotePdf";
import { Download } from "lucide-react";

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

  useEffect(() => {
    if (quote?.status) {
      setStatus(quote.status);
    }
  }, [quote]);

  const itemsTotal = useMemo(() => {
    return (quote?.items ?? []).reduce((sum, item) => {
      return sum + item.quantity * item.unit_price_cents;
    }, 0);
  }, [quote?.items]);

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
          details: { status: nextStatus },
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

      const nextTotal = itemsTotal + quantity * unitPriceCents;
      await updateQuoteAmount(quote?.id as string, nextTotal);

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
              <p className="text-sm text-foreground">{formatCurrency(quote.amount_cents)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prazo</p>
              <p className="text-sm text-foreground">
                {quote.deadline_text ? quote.deadline_text : "A definir"}
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
                Total calculado:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(itemsTotal)}
                </span>
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
