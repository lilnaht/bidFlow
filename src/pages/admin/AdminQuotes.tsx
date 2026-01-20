import { useMemo, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createActivityLog, fetchQuotes, updateQuoteStatus } from "@/integrations/supabase/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { quoteStatusLabels, quoteStatusStyles, type QuoteStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { CheckCircle2, ClipboardList, Plus, Receipt, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const filters = [
  { value: "all", label: "Todos", filter: () => true },
  { value: "draft", label: "Em edicao", filter: (status: string) => status === "draft" },
  { value: "sent", label: "Enviados", filter: (status: string) => status === "sent" },
  { value: "approved", label: "Aprovados", filter: (status: string) => status === "approved" },
  { value: "lost", label: "Perdidos", filter: (status: string) => status === "lost" },
];

const AdminQuotes = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: quotes = [], isLoading, error } = useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });
  const [view, setView] = useState<"table" | "kanban">("table");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      updateQuoteStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Status atualizado",
        description: "A proposta foi movida com sucesso.",
      });
      createActivityLog({
        entityType: "quote",
        entityId: variables.id,
        action: "status_updated",
        payload: { status: variables.status, origin: "kanban" },
        actorId: user?.id ?? null,
        createdBy: user?.id ?? null,
      }).catch(() => undefined);
    },
    onError: () => {
      toast({
        title: "Erro ao mover",
        description: "Nao foi possivel atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const summary = useMemo(() => {
    const countByStatus = (status: string) =>
      quotes.filter((quote) => quote.status === status).length;

    const sumByStatus = (status: string) =>
      quotes
        .filter((quote) => quote.status === status)
        .reduce((sum, quote) => sum + (quote.amount_cents || 0), 0);

    return [
      {
        title: "Em elaboracao",
        value: countByStatus("draft"),
        detail: `${countByStatus("draft")} em andamento`,
        icon: ClipboardList,
      },
      {
        title: "Enviados",
        value: countByStatus("sent"),
        detail: `${formatCurrency(sumByStatus("sent"))} em negociacao`,
        icon: Receipt,
      },
      {
        title: "Aprovados",
        value: countByStatus("approved"),
        detail: `${formatCurrency(sumByStatus("approved"))} confirmados`,
        icon: CheckCircle2,
      },
      {
        title: "Perdidos",
        value: countByStatus("lost"),
        detail: "Revisar motivos",
        icon: XCircle,
      },
    ];
  }, [quotes]);

  const grouped = useMemo(() => {
    return filters.reduce<Record<string, typeof quotes>>((acc, filter) => {
      acc[filter.value] = quotes.filter((quote) => filter.filter(quote.status));
      return acc;
    }, {});
  }, [quotes]);

  const kanbanColumns: Array<{ status: QuoteStatus; title: string }> = [
    { status: "draft", title: "Em edicao" },
    { status: "sent", title: "Enviados" },
    { status: "approved", title: "Aprovados" },
    { status: "lost", title: "Perdidos" },
  ];

  const handleDragStart = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDrop = (status: QuoteStatus) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (!id) {
      return;
    }
    const target = quotes.find((quote) => quote.id === id);
    if (!target || target.status === status) {
      return;
    }
    statusMutation.mutate({ id, status });
    setDraggingId(null);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Orcamentos</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar os orcamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Orcamentos</h1>
          <p className="text-muted-foreground">
            Acompanhe propostas em andamento e metricas de conversao.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            Lista
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/orcamentos/novo">
              <Plus className="h-4 w-4" />
              Nova proposta
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-border/60">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {item.title}
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Carregando propostas...
        </div>
      ) : view === "table" ? (
        <Tabs defaultValue="all">
          <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
            {filters.map((filter) => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {filters.map((filter) => {
            const items = grouped[filter.value] ?? [];
            return (
              <TabsContent key={filter.value} value={filter.value}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      {filter.label} ({items.length})
                    </CardTitle>
                    <CardDescription>
                      Gerencie prazos, valores e status das propostas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                        Nenhuma proposta nesta etapa.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proposta</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Atualizado</TableHead>
                            <TableHead className="text-right">Acoes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium text-foreground">{item.title}</div>
                                <div className="text-xs text-muted-foreground">{item.id}</div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.client?.name ?? "Cliente nao informado"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatCurrency(item.amount_cents)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.deadline_text ? item.deadline_text : "A definir"}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("border-0", quoteStatusStyles[item.status])}>
                                  {quoteStatusLabels[item.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatRelativeTime(item.updated_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button asChild variant="ghost" size="sm">
                                  <Link to={`/admin/orcamentos/${item.id}`}>Ver proposta</Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {kanbanColumns.map((column) => {
            const items = quotes.filter((quote) => quote.status === column.status);
            return (
              <div
                key={column.status}
                className="rounded-xl border border-border/60 bg-card p-4"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop(column.status)}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{column.title}</p>
                    <p className="text-xs text-muted-foreground">{items.length} propostas</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                      Arraste propostas para esta etapa.
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-lg border border-border/60 bg-background p-3 shadow-sm",
                          draggingId === item.id && "opacity-60"
                        )}
                        draggable
                        onDragStart={handleDragStart(item.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.client?.name ?? "Cliente nao informado"}
                            </p>
                          </div>
                          <Badge className={cn("border-0", quoteStatusStyles[item.status])}>
                            {quoteStatusLabels[item.status]}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(item.amount_cents)}</span>
                          <Link to={`/admin/orcamentos/${item.id}`} className="text-primary">
                            Abrir
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminQuotes;
