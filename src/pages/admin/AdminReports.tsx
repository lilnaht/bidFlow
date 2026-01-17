import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchClients, fetchQuotes, fetchRequests } from "@/integrations/supabase/queries";
import { formatCurrency } from "@/lib/format";

const AdminReports = () => {
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });
  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  });
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const isLoading = loadingRequests || loadingQuotes || loadingClients;

  const metrics = useMemo(() => {
    const totalRequests = requests.length;
    const totalQuotes = quotes.length;
    const approvedQuotes = quotes.filter((quote) => quote.status === "approved");
    const approvedCount = approvedQuotes.length;

    const conversionToQuote = totalRequests
      ? Math.round((totalQuotes / totalRequests) * 100)
      : 0;
    const conversionToApproved = totalQuotes
      ? Math.round((approvedCount / totalQuotes) * 100)
      : 0;

    const avgApprovalMs =
      approvedQuotes.reduce((sum, quote) => {
        const created = new Date(quote.created_at).getTime();
        const updated = new Date(quote.updated_at).getTime();
        return sum + Math.max(0, updated - created);
      }, 0) / (approvedQuotes.length || 1);

    const avgApprovalDays = Math.round(avgApprovalMs / (1000 * 60 * 60 * 24));

    return {
      totalRequests,
      totalQuotes,
      approvedCount,
      conversionToQuote,
      conversionToApproved,
      avgApprovalDays,
    };
  }, [quotes, requests]);

  const ticketByClient = useMemo(() => {
    const totals = new Map<string, { name: string; total: number; count: number }>();

    quotes.forEach((quote) => {
      if (!quote.client_id) {
        return;
      }

      const client = clients.find((item) => item.id === quote.client_id);
      const name = client?.name ?? "Cliente sem nome";
      const current = totals.get(quote.client_id) ?? { name, total: 0, count: 0 };
      totals.set(quote.client_id, {
        name,
        total: current.total + (quote.amount_cents || 0),
        count: current.count + 1,
      });
    });

    return Array.from(totals.values())
      .map((item) => ({
        ...item,
        avg: item.count ? item.total / item.count : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [clients, quotes]);

  const pipelineByMonth = useMemo(() => {
    const map = new Map<string, { created: number; sent: number; approved: number; lost: number }>();

    quotes.forEach((quote) => {
      const date = new Date(quote.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = map.get(monthKey) ?? { created: 0, sent: 0, approved: 0, lost: 0 };
      current.created += 1;
      if (quote.status === "sent") current.sent += 1;
      if (quote.status === "approved") current.approved += 1;
      if (quote.status === "lost") current.lost += 1;
      map.set(monthKey, current);
    });

    return Array.from(map.entries())
      .sort((a, b) => (a[0] > b[0] ? -1 : 1))
      .slice(0, 6);
  }, [quotes]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Relatorios</h1>
        <p className="text-muted-foreground">
          Indicadores de conversao, ticket medio e pipeline.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          Carregando relatorios...
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Conversao para propostas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.conversionToQuote}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalQuotes} propostas para {metrics.totalRequests} solicitacoes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Conversao para aprovacao
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.conversionToApproved}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.approvedCount} aprovadas no total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Tempo medio ate aprovacao
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {metrics.avgApprovalDays} dias
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado em propostas aprovadas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Total em propostas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    quotes.reduce((sum, quote) => sum + (quote.amount_cents || 0), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todas as propostas cadastradas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ticket por cliente</CardTitle>
                <CardDescription>Maiores valores e media por cliente</CardDescription>
              </CardHeader>
              <CardContent>
                {ticketByClient.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    Nenhum orcamento registrado.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Ticket medio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketByClient.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(item.total)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(item.avg)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Pipeline por mes</CardTitle>
                <CardDescription>Propostas criadas e status atual</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineByMonth.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    Sem dados no periodo.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead>Criadas</TableHead>
                        <TableHead>Enviadas</TableHead>
                        <TableHead>Aprovadas</TableHead>
                        <TableHead>Perdidas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pipelineByMonth.map(([month, stats]) => (
                        <TableRow key={month}>
                          <TableCell className="font-medium text-foreground">{month}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{stats.created}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{stats.sent}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{stats.approved}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{stats.lost}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
