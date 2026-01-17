import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  createActivityLog,
  createContact,
  createTask,
  fetchClientById,
  fetchActivityLog,
  fetchTasksByEntity,
  updateClientStatus,
  updateTaskStatus,
} from "@/integrations/supabase/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import {
  clientStatusLabels,
  clientStatusStyles,
  quoteStatusLabels,
  quoteStatusStyles,
  requestStatusLabels,
  requestStatusStyles,
  taskStatusLabels,
  taskStatusStyles,
  type ClientStatus,
  type TaskStatus,
} from "@/lib/status";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

type TaskFormValues = {
  title: string;
  dueAt: string;
};

const AdminClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ClientStatus | "">("");
  const { user } = useAuth();

  const {
    register: registerContact,
    handleSubmit: handleSubmitContact,
    reset: resetContact,
    formState: { errors: contactErrors },
  } = useForm<ContactFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
    },
  });

  const {
    register: registerTask,
    handleSubmit: handleSubmitTask,
    reset: resetTask,
    formState: { errors: taskErrors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      dueAt: "",
    },
  });

  const { data: client, isLoading, error } = useQuery({
    queryKey: ["clients", id],
    queryFn: () => fetchClientById(id as string),
    enabled: Boolean(id),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activity", "client", id],
    queryFn: () => fetchActivityLog("client", id as string),
    enabled: Boolean(id),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "client", id],
    queryFn: () => fetchTasksByEntity({ clientId: id as string }),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (client?.status) {
      setStatus(client.status);
    }
  }, [client]);

  const mutation = useMutation({
    mutationFn: (nextStatus: ClientStatus) => updateClientStatus(id as string, nextStatus),
    onSuccess: (_data, nextStatus) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
      queryClient.invalidateQueries({ queryKey: ["activity", "client", id] });
      toast({
        title: "Status atualizado",
        description: "O cliente foi atualizado.",
      });
      if (client) {
        createActivityLog({
          entityType: "client",
          entityId: client.id,
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

  const contactMutation = useMutation({
    mutationFn: (values: ContactFormValues) =>
      createContact({
        clientId: id as string,
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        role: values.role || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
      toast({
        title: "Contato adicionado",
        description: "O contato foi salvo com sucesso.",
      });
      resetContact({ name: "", email: "", phone: "", role: "" });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Nao foi possivel salvar o contato.",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (values: TaskFormValues) =>
      createTask({
        title: values.title,
        dueAt: values.dueAt ? new Date(`${values.dueAt}T00:00:00`).toISOString() : null,
        clientId: id ?? null,
        createdBy: user?.id ?? null,
        assignedTo: user?.id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "client", id] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi adicionada ao cliente.",
      });
      resetTask({ title: "", dueAt: "" });
    },
    onError: () => {
      toast({
        title: "Erro ao criar tarefa",
        description: "Nao foi possivel salvar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const taskStatusMutation = useMutation({
    mutationFn: ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus }) =>
      updateTaskStatus(taskId, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "client", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Carregando cliente...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Cliente</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar os detalhes do cliente.
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Cliente</h1>
        <p className="text-sm text-muted-foreground">Cliente nao encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{client.name}</h1>
          <p className="text-muted-foreground">
            Atualizado {formatRelativeTime(client.updated_at)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/clientes">Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informacoes do cliente</CardTitle>
          <CardDescription>Dados de contato e status atual</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="text-sm text-foreground">{client.email ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="text-sm text-foreground">{client.phone ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Segmento</p>
              <p className="text-sm text-foreground">{client.segment ?? "Nao informado"}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Select value={status} onValueChange={(value) => setStatus(value as ClientStatus)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="negotiation">Negociacao</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => status && mutation.mutate(status as ClientStatus)}
                  disabled={!status || mutation.isPending}
                >
                  {mutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Badge className={cn("border-0", clientStatusStyles[client.status])}>
                  {clientStatusLabels[client.status]}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Contatos</CardTitle>
          <CardDescription>Pessoas de contato vinculadas ao cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleSubmitContact((values) => contactMutation.mutate(values))}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact-name">Nome</Label>
              <Input id="contact-name" placeholder="Nome do contato" {...registerContact("name", { required: true })} />
              {contactErrors.name && (
                <p className="text-sm text-destructive">Informe o nome.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">E-mail</Label>
              <Input id="contact-email" placeholder="contato@empresa.com" {...registerContact("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input id="contact-phone" placeholder="(11) 99999-9999" {...registerContact("phone")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact-role">Cargo</Label>
              <Input id="contact-role" placeholder="Compras, Marketing, Diretoria..." {...registerContact("role")} />
            </div>
            <div className="flex items-end md:col-span-2">
              <Button type="submit" disabled={contactMutation.isPending}>
                {contactMutation.isPending ? "Salvando..." : "Adicionar contato"}
              </Button>
            </div>
          </form>

          {client.contacts?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium text-foreground">{contact.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.role ?? "Nao informado"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.email ?? "Sem e-mail"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.phone ?? "Sem telefone"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum contato cadastrado.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Solicitacoes</CardTitle>
          <CardDescription>Historico de pedidos do cliente</CardDescription>
        </CardHeader>
        <CardContent>
          {client.requests?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recebido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-foreground">
                      <Link to={`/admin/solicitacoes/${request.id}`} className="hover:underline">
                        {request.project_type}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-0", requestStatusStyles[request.status])}>
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
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhuma solicitacao registrada.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tarefas</CardTitle>
          <CardDescription>Acompanhe pendencias do cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleSubmitTask((values) => createTaskMutation.mutate(values))}
            className="grid gap-4 md:grid-cols-3"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">Titulo</Label>
              <Input id="task-title" placeholder="Retornar proposta" {...registerTask("title", { required: true })} />
              {taskErrors.title && (
                <p className="text-sm text-destructive">Informe o titulo.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Prazo</Label>
              <Input id="task-due" type="date" {...registerTask("dueAt")} />
            </div>
            <div className="flex items-end md:col-span-3">
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Salvando..." : "Adicionar tarefa"}
              </Button>
            </div>
          </form>

          {tasksLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando tarefas...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhuma tarefa vinculada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium text-foreground">{task.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("border-0", taskStatusStyles[task.status])}>
                          {taskStatusLabels[task.status]}
                        </Badge>
                        <Select
                          value={task.status}
                          onValueChange={(value) =>
                            taskStatusMutation.mutate({
                              taskId: task.id,
                              nextStatus: value as TaskStatus,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">A fazer</SelectItem>
                            <SelectItem value="doing">Em andamento</SelectItem>
                            <SelectItem value="done">Concluida</SelectItem>
                            <SelectItem value="blocked">Bloqueada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.due_at ? formatRelativeTime(task.due_at) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Orcamentos</CardTitle>
          <CardDescription>Propostas registradas para o cliente</CardDescription>
        </CardHeader>
        <CardContent>
          {client.quotes?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposta</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium text-foreground">
                      <Link to={`/admin/orcamentos/${quote.id}`} className="hover:underline">
                        {quote.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(quote.amount_cents)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-0", quoteStatusStyles[quote.status])}>
                        {quoteStatusLabels[quote.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(quote.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum orcamento registrado.
            </div>
          )}
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

export default AdminClientDetail;
