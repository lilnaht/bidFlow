import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { fetchInvoices, updateInvoice, type InvoiceWithRelations } from "@/integrations/supabase/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

const AdminInvoices = () => {
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const [editing, setEditing] = useState<InvoiceWithRelations | null>(null);
  const [status, setStatus] = useState<string>("");
  const [paidAt, setPaidAt] = useState<string>("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!editing) {
        return null;
      }

      return updateInvoice({
        id: editing.id,
        status: status as "pending" | "paid" | "overdue",
        paidAt: paidAt ? new Date(paidAt).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Fatura atualizada",
        description: "Status atualizado com sucesso.",
      });
      setEditing(null);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Nao foi possivel salvar a fatura.",
        variant: "destructive",
      });
    },
  });

  const startEdit = (invoice: InvoiceWithRelations) => {
    setEditing(invoice);
    setStatus(invoice.status);
    setPaidAt(invoice.paid_at ? invoice.paid_at.slice(0, 10) : "");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Faturas</h1>
        <p className="text-muted-foreground">
          Controle parcelas, pagamentos e status do faturamento.
        </p>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Atualizar fatura</CardTitle>
            <CardDescription>
              Ajuste o status e a data de pagamento para a fatura selecionada.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Em atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAt">Pago em</Label>
              <Input
                id="paidAt"
                type="date"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Faturas registradas</CardTitle>
          <CardDescription>Lista completa das cobrancas.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nao foi possivel carregar as faturas.
            </div>
          ) : isLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando faturas...
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhuma fatura registrada ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-foreground">
                      {invoice.quote?.title ?? "Sem proposta"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.quote?.client?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(invoice.amount_cents)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.due_at ? formatRelativeTime(invoice.due_at) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{invoice.status}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.paid_at ? invoice.paid_at.slice(0, 10) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(invoice)}>
                        Atualizar
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

export default AdminInvoices;
