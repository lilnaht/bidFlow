import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchQuotes, fetchRequests, fetchSettings } from "@/integrations/supabase/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { quoteStatusLabels, quoteStatusStyles, requestStatusLabels, requestStatusStyles } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Banknote, FileText, Inbox, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
  } = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });

  const {
    data: quotes = [],
    isLoading: quotesLoading,
    error: quotesError,
  } = useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });

  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const isLoading = requestsLoading || quotesLoading || settingsLoading;
  const error = requestsError || quotesError || settingsError;

  const metrics = useMemo(() => {
    const newRequests = requests.filter((request) => request.status === "new").length;
    const pendingRequests = requests.filter((request) =>
      ["new", "review"].includes(request.status)
    ).length;

    const sentQuotes = quotes.filter((quote) => quote.status === "sent").length;
    const approvedQuotes = quotes.filter((quote) => quote.status === "approved").length;
    const totalQuotes = quotes.length;
    const conversionRate = totalQuotes ? Math.round((approvedQuotes / totalQuotes) * 100) : 0;

    const approvedRevenue = quotes
      .filter((quote) => quote.status === "approved")
      .reduce((sum, quote) => sum + (quote.amount_cents || 0), 0);

    const openRevenue = quotes
      .filter((quote) => ["draft", "sent"].includes(quote.status))
      .reduce((sum, quote) => sum + (quote.amount_cents || 0), 0);

    const sentRevenue = quotes
      .filter((quote) => quote.status === "sent")
      .reduce((sum, quote) => sum + (quote.amount_cents || 0), 0);

    return {
      newRequests,
      pendingRequests,
      sentQuotes,
      approvedQuotes,
      totalQuotes,
      conversionRate,
      approvedRevenue,
      openRevenue,
      sentRevenue,
    };
  }, [quotes, requests]);

  const stats = useMemo(
    () => [
      {
        title: "Novas solicitacoes",
        value: metrics.newRequests.toString(),
        detail: metrics.pendingRequests
          ? `${metrics.pendingRequests} em andamento`
          : "Sem solicitacoes pendentes",
        icon: Inbox,
      },
      {
        title: "Orcamentos enviados",
        value: metrics.sentQuotes.toString(),
        detail: `${formatCurrency(metrics.sentRevenue)} em negociacao`,
        icon: FileText,
      },
      {
        title: "Taxa de conversao",
        value: `${metrics.conversionRate}%`,
        detail: `${metrics.approvedQuotes} aprovados`,
        icon: TrendingUp,
      },
      {
        title: "Receita estimada",
        value: formatCurrency(metrics.approvedRevenue),
        detail: `${formatCurrency(metrics.sentRevenue)} em negociacao`,
        icon: Banknote,
      },
    ],
    [metrics]
  );

  const pipeline = useMemo(() => {
    const sumByStatus = (status: string) =>
      quotes
        .filter((quote) => quote.status === status)
        .reduce((sum, quote) => sum + (quote.amount_cents || 0), 0);

    const countByStatus = (status: string) =>
      quotes.filter((quote) => quote.status === status).length;

    return [
      {
        label: "Em edicao",
        status: "draft",
        count: countByStatus("draft"),
        value: formatCurrency(sumByStatus("draft")),
        tone: quoteStatusStyles.draft,
      },
      {
        label: "Enviados",
        status: "sent",
        count: countByStatus("sent"),
        value: formatCurrency(sumByStatus("sent")),
        tone: quoteStatusStyles.sent,
      },
      {
        label: "Aprovados",
        status: "approved",
        count: countByStatus("approved"),
        value: formatCurrency(sumByStatus("approved")),
        tone: quoteStatusStyles.approved,
      },
      {
        label: "Perdidos",
        status: "lost",
        count: countByStatus("lost"),
        value: formatCurrency(sumByStatus("lost")),
        tone: quoteStatusStyles.lost,
      },
    ];
  }, [quotes]);

  const activities = useMemo(() => {
    const requestActivities = requests.slice(0, 5).map((request) => ({
      id: `request-${request.id}`,
      title: `Nova solicitacao de ${request.name}`,
      detail: `Projeto: ${request.project_type}`,
      date: new Date(request.created_at),
    }));

    const quoteActivities = quotes.slice(0, 5).map((quote) => ({
      id: `quote-${quote.id}`,
      title: `Proposta ${quoteStatusLabels[quote.status].toLowerCase()}: ${quote.title}`,
      detail: quote.client?.name ? `Cliente: ${quote.client.name}` : "Cliente nao informado",
      date: new Date(quote.updated_at),
    }));

    return [...requestActivities, ...quoteActivities]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  }, [quotes, requests]);

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Painel</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar os dados do painel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-muted-foreground">
          Acompanhe o resumo das ultimas oportunidades e resultados.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Carregando dados do painel...
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="border-border/60">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.detail}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Solicitacoes recentes</CardTitle>
                <CardDescription>Ultimas entradas recebidas no formulario</CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    Nenhuma solicitacao registrada ainda.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Faixa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recebido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.slice(0, 4).map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium text-foreground">
                            {request.client?.name ?? request.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {request.project_type}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {request.budget_estimate ? request.budget_estimate : "A definir"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn("border-0", requestStatusStyles[request.status])}
                            >
                              {requestStatusLabels[request.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatRelativeTime(request.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Pipeline</CardTitle>
                  <CardDescription>Valor estimado por etapa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pipeline.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.count} oportunidades
                        </div>
                      </div>
                      <Badge className={cn("border-0", item.tone)}>{item.value}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Meta do mes</CardTitle>
                  <CardDescription>
                    {settings?.monthly_goal_cents
                      ? `${formatCurrency(settings.monthly_goal_cents)} em novos contratos`
                      : "Defina a meta no painel de configuracoes"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings?.monthly_goal_cents ? (
                    <>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>{formatCurrency(metrics.approvedRevenue)} fechados</span>
                          <span>
                            {Math.min(
                              100,
                              Math.round(
                                (metrics.approvedRevenue / settings.monthly_goal_cents) * 100
                              )
                            )}
                            %
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{formatCurrency(metrics.openRevenue)} em aberto</span>
                          <span>
                            {Math.min(
                              100,
                              Math.round(
                                (metrics.openRevenue / settings.monthly_goal_cents) * 100
                              )
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(
                          100,
                          Math.round(
                            (metrics.approvedRevenue / settings.monthly_goal_cents) * 100
                          )
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Faltam{" "}
                        {formatCurrency(
                          Math.max(0, settings.monthly_goal_cents - metrics.approvedRevenue)
                        )}{" "}
                        para atingir a meta.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Configure uma meta para acompanhar a evolucao do faturamento.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Atividades recentes</CardTitle>
              <CardDescription>Atualizacoes registradas nas ultimas 48 horas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  Sem atividades recentes.
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-1 rounded-lg border border-border/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-foreground">
                        {activity.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.date.toISOString())}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
