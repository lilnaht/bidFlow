import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchRequests } from "@/integrations/supabase/queries";
import { formatRelativeTime } from "@/lib/format";
import { requestStatusLabels, requestStatusStyles } from "@/lib/status";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

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
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });

  const grouped = useMemo(() => {
    return filters.reduce<Record<string, typeof requests>>((acc, filter) => {
      acc[filter.value] = requests.filter((request) => filter.filter(request.status));
      return acc;
    }, {});
  }, [requests]);

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
        <Button asChild size="sm">
          <Link to="/admin/orcamentos/novo">
            <FileText className="h-4 w-4" />
            Criar orcamento
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Carregando solicitacoes...
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default AdminRequests;
