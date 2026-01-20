import { useMemo, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createActivityLog, fetchRequests, updateRequestStatus } from "@/integrations/supabase/queries";
import { formatRelativeTime } from "@/lib/format";
import { requestStatusLabels, requestStatusStyles, type RequestStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const sourceLabels: Record<string, string> = {
  form: "Formulario",
  whatsapp: "WhatsApp",
  referral: "Indicacao",
  linkedin: "LinkedIn",
};

const filters = [
  { value: "all", label: "Todas", filter: () => true },
  { value: "new", label: "Novas", filter: (status: string) => status === "new" },
  { value: "review", label: "Em analise", filter: (status: string) => status === "review" },
  { value: "sent", label: "Enviadas", filter: (status: string) => status === "sent" },
  { value: "approved", label: "Aprovadas", filter: (status: string) => status === "approved" },
  { value: "lost", label: "Perdidas", filter: (status: string) => status === "lost" },
];

const AdminRequests = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });
  const [view, setView] = useState<"table" | "kanban">("table");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      updateRequestStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({
        title: "Status atualizado",
        description: "A solicitacao foi movida com sucesso.",
      });
      createActivityLog({
        entityType: "request",
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

  const grouped = useMemo(() => {
    return filters.reduce<Record<string, typeof requests>>((acc, filter) => {
      acc[filter.value] = requests.filter((request) => filter.filter(request.status));
      return acc;
    }, {});
  }, [requests]);

  const kanbanColumns: Array<{ status: RequestStatus; title: string }> = [
    { status: "new", title: "Novas" },
    { status: "review", title: "Em analise" },
    { status: "sent", title: "Enviadas" },
    { status: "approved", title: "Aprovadas" },
    { status: "lost", title: "Perdidas" },
  ];

  const handleDragStart = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDrop = (status: RequestStatus) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (!id) {
      return;
    }
    const target = requests.find((request) => request.id === id);
    if (!target || target.status === status) {
      return;
    }
    statusMutation.mutate({ id, status });
    setDraggingId(null);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Solicitacoes</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar as solicitacoes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Solicitacoes</h1>
          <p className="text-muted-foreground">
            Organize os pedidos recebidos e envie propostas rapidamente.
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
              <FileText className="h-4 w-4" />
              Criar orcamento
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Carregando solicitacoes...
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
                      Atualize o status ou abra um orcamento com um clique.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                        Nenhuma solicitacao nesta etapa.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Canal</TableHead>
                            <TableHead>Faixa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Recebido</TableHead>
                            <TableHead className="text-right">Acoes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium text-foreground">
                                  {item.client?.name ?? item.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.email ?? "Sem e-mail"}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.project_type}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {sourceLabels[item.source] ?? item.source}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.budget_estimate ? item.budget_estimate : "A definir"}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("border-0", requestStatusStyles[item.status])}>
                                  {requestStatusLabels[item.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatRelativeTime(item.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button asChild variant="ghost" size="sm">
                                  <Link to={`/admin/solicitacoes/${item.id}`}>Ver detalhes</Link>
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
        <div className="grid gap-4 lg:grid-cols-5">
          {kanbanColumns.map((column) => {
            const items = requests.filter((request) => request.status === column.status);
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
                    <p className="text-xs text-muted-foreground">{items.length} solicitacoes</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                      Arraste solicitacoes para esta etapa.
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
                            <p className="text-sm font-semibold text-foreground">
                              {item.client?.name ?? item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.project_type}
                            </p>
                          </div>
                          <Badge className={cn("border-0", requestStatusStyles[item.status])}>
                            {requestStatusLabels[item.status]}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{sourceLabels[item.source] ?? item.source}</span>
                          <Link to={`/admin/solicitacoes/${item.id}`} className="text-primary">
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

export default AdminRequests;
