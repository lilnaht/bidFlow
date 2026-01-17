import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchClients, fetchQuotes } from "@/integrations/supabase/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { clientStatusLabels, clientStatusStyles } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Plus, Users } from "lucide-react";

const AdminClients = () => {
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });

  const projectsByClient = useMemo(() => {
    return quotes.reduce<Record<string, number>>((acc, quote) => {
      if (quote.client?.id) {
        acc[quote.client.id] = (acc[quote.client.id] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [quotes]);

  const summaryCards = useMemo(() => {
    const activeCount = clients.filter((client) => client.status === "active").length;
    const negotiationCount = clients.filter((client) => client.status === "negotiation").length;
    const inactiveCount = clients.filter((client) => client.status === "inactive").length;
    const avgTicket = quotes.length
      ? Math.round(
          quotes.reduce((sum, quote) => sum + (quote.amount_cents || 0), 0) / quotes.length
        )
      : 0;

    return [
      { label: "Clientes ativos", value: activeCount, detail: "Relacionamento ativo", icon: Users },
      { label: "Em negociacao", value: negotiationCount, detail: "Em andamento", icon: Users },
      {
        label: "Ticket medio",
        value: formatCurrency(avgTicket),
        detail: "Media das propostas",
        icon: Users,
      },
      { label: "Inativos", value: inactiveCount, detail: "Sem retorno", icon: Users },
    ];
  }, [clients, quotes]);

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar os clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Historico de contatos, segmentacao e status de relacionamento.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/clientes/novo">
            <Plus className="h-4 w-4" />
            Adicionar cliente
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/60">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {card.label}
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Base de clientes</CardTitle>
          <CardDescription>Ultimos contatos e status atual</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando clientes...
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum cliente cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Projetos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ultimo contato</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {client.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{client.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {client.email ?? "Sem e-mail"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {client.phone ?? "Sem telefone"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.segment ?? "Nao informado"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {projectsByClient[client.id] ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-0", clientStatusStyles[client.status])}>
                        {clientStatusLabels[client.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(client.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/admin/clientes/${client.id}`}>Ver perfil</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClients;
