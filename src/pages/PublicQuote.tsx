import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pdf } from "@react-pdf/renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPublicQuote,
  type PublicQuotePayload,
  type QuoteWithItems,
} from "@/integrations/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { calculateQuoteTotals } from "@/lib/quote";
import QuotePdfDocument from "@/components/pdf/QuotePdf";
import { CheckCircle2, Download, XCircle } from "lucide-react";

type SignedAttachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  signed_url: string | null;
};

const PublicQuote = () => {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-quote", token],
    queryFn: () => fetchPublicQuote(token as string),
    enabled: Boolean(token),
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ["public-quote-attachments", token],
    queryFn: async () => {
      const { data: response, error: invokeError } = await supabase.functions.invoke(
        "quote-attachments",
        { body: { token } }
      );
      if (invokeError) {
        throw invokeError;
      }
      return (response?.attachments ?? []) as SignedAttachment[];
    },
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!token) {
      return;
    }
    supabase.functions.invoke("quote-event", {
      body: { token, eventType: "opened" },
    }).catch(() => undefined);
  }, [token]);

  const quotePayload = data as PublicQuotePayload | null;
  const pdfQuote = useMemo(() => {
    if (!quotePayload) {
      return null;
    }
    return {
      ...quotePayload.quote,
      client: quotePayload.client,
      request: null,
      items: quotePayload.items,
    } as QuoteWithItems;
  }, [quotePayload]);

  const totals = useMemo(() => {
    if (!quotePayload) {
      return { itemsTotal: 0, discountCents: 0, totalCents: 0 };
    }
    return calculateQuoteTotals(quotePayload.items, quotePayload.quote);
  }, [quotePayload]);

  const responseMutation = useMutation({
    mutationFn: async (status: "accepted" | "declined") => {
      const { data: response, error: invokeError } = await supabase.functions.invoke(
        "quote-response",
        {
          body: {
            token,
            status,
            name,
            comment,
            acceptedTerms,
          },
        }
      );
      if (invokeError) {
        throw invokeError;
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-quote", token] });
      toast({
        title: "Resposta registrada",
        description: "Obrigado pelo retorno. Sua resposta foi salva.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar",
        description: "Nao foi possivel registrar sua resposta.",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async () => {
    if (!pdfQuote) {
      return;
    }
    try {
      setIsDownloading(true);
      const logoUrl =
        typeof window !== "undefined" ? `${window.location.origin}/logo2.png` : undefined;
      const doc = (
        <QuotePdfDocument quote={pdfQuote} settings={quotePayload?.settings ?? null} logoUrl={logoUrl} />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposta-${pdfQuote.id.slice(0, 8).toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      supabase.functions.invoke("quote-event", {
        body: { token, eventType: "downloaded" },
      }).catch(() => undefined);
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Nao foi possivel gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            Carregando proposta...
          </div>
        </div>
      </section>
    );
  }

  if (error || !quotePayload) {
    return (
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h1 className="font-display text-2xl font-bold text-foreground">Proposta expirada</h1>
            <p className="text-muted-foreground">
              O link nao e valido ou ja expirou. Fale conosco para gerar uma nova proposta.
            </p>
            <Button asChild className="mt-4">
              <Link to="/solicitar-orcamento">Solicitar novo orcamento</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-background">
      <div className="container-narrow space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {quotePayload.quote.title}
            </h1>
            <p className="text-muted-foreground">
              Proposta valida ate {formatDate(quotePayload.quote.public_expires_at)}
            </p>
          </div>
          <Button onClick={handleDownload} disabled={isDownloading}>
            <Download className="h-4 w-4" />
            {isDownloading ? "Gerando..." : "Baixar PDF"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumo</CardTitle>
            <CardDescription>Detalhes principais do orcamento</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="text-base font-semibold text-foreground">
                {quotePayload.client?.name ?? "Cliente"}
              </p>
              <p className="text-sm text-muted-foreground">
                {quotePayload.client?.email ?? "-"} • {quotePayload.client?.phone ?? "-"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="secondary">{quotePayload.quote.status}</Badge>
              <p className="text-sm text-muted-foreground">Prazo</p>
              <p className="text-sm text-foreground">
                {quotePayload.quote.deadline_text ?? "A definir"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Itens</CardTitle>
            <CardDescription>Servicos inclusos na proposta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quotePayload.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Nenhum item detalhado nesta proposta.
              </div>
            ) : (
              quotePayload.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unit_price_cents)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  Subtotal:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totals.itemsTotal)}
                  </span>
                </span>
                {totals.discountCents > 0 ? (
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
          </CardContent>
        </Card>

        {quotePayload.quote.template_snapshot ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Detalhamento</CardTitle>
              <CardDescription>Texto da proposta enviada.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-foreground whitespace-pre-line">
                {quotePayload.quote.template_snapshot}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Anexos</CardTitle>
            <CardDescription>Arquivos vinculados a esta proposta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {attachments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Nenhum arquivo anexado.
              </div>
            ) : (
              attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.file_type ?? "Arquivo"} •{" "}
                      {attachment.file_size ? `${Math.round(attachment.file_size / 1024)} KB` : "Tamanho desconhecido"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!attachment.signed_url}
                    onClick={() => {
                      if (!attachment.signed_url) {
                        return;
                      }
                      window.open(attachment.signed_url, "_blank", "noopener");
                      supabase.functions.invoke("quote-event", {
                        body: {
                          token,
                          eventType: "clicked",
                          payload: { attachmentId: attachment.id },
                        },
                      }).catch(() => undefined);
                    }}
                  >
                    Abrir
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Responder proposta</CardTitle>
            <CardDescription>Confirme o aceite ou envie uma recusa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="public-name">Nome completo</Label>
              <Input
                id="public-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-comment">Comentario (opcional)</Label>
              <Textarea
                id="public-comment"
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Deixe um recado sobre a proposta"
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={acceptedTerms} onCheckedChange={(value) => setAcceptedTerms(Boolean(value))} />
              <span className="text-sm text-muted-foreground">
                Concordo com os termos apresentados na proposta.{" "}
                <Link to="/termos" className="text-primary underline">
                  Ler termos
                </Link>
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => responseMutation.mutate("accepted")}
                disabled={responseMutation.isPending || !acceptedTerms || !name || quotePayload.quote.status !== "sent"}
              >
                <CheckCircle2 className="h-4 w-4" />
                Aprovar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => responseMutation.mutate("declined")}
                disabled={responseMutation.isPending || !acceptedTerms || !name || quotePayload.quote.status !== "sent"}
              >
                <XCircle className="h-4 w-4" />
                Recusar
              </Button>
            </div>
            {quotePayload.quote.status !== "sent" ? (
              <p className="text-xs text-muted-foreground">
                Esta proposta ja foi encerrada. Se precisar de ajustes, entre em contato.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Contato</CardTitle>
            <CardDescription>Fale com a equipe caso tenha duvidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">
              {quotePayload.settings?.company_name ?? "bidFlow"}
            </p>
            <p>{quotePayload.settings?.company_email ?? "contato@bidflow.com"}</p>
            <p>{quotePayload.settings?.company_phone ?? "(11) 99999-9999"}</p>
            <p>{quotePayload.settings?.company_address ?? "Sao Paulo, SP"}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PublicQuote;
