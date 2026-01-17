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
  createTask,
  fetchRequestById,
  fetchActivityLog,
  fetchTasksByEntity,
  updateRequestStatus,
  updateTaskStatus,
} from "@/integrations/supabase/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import {
  quoteStatusLabels,
  quoteStatusStyles,
  requestStatusLabels,
  requestStatusStyles,
  taskStatusLabels,
  taskStatusStyles,
  type RequestStatus,
  type TaskStatus,
} from "@/lib/status";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type TaskFormValues = {
  title: string;
  dueAt: string;
};

const sourceLabels: Record<string, string> = {
  form: "Formulario",
  whatsapp: "WhatsApp",
  referral: "Indicacao",
  linkedin: "LinkedIn",
};

const AdminRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      dueAt: "",
    },
  });

  const { data: request, isLoading, error } = useQuery({
    queryKey: ["requests", id],
    queryFn: () => fetchRequestById(id as string),
    enabled: Boolean(id),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activity", "request", id],
    queryFn: () => fetchActivityLog("request", id as string),
    enabled: Boolean(id),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "request", id],
    queryFn: () => fetchTasksByEntity({ requestId: id as string }),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (request?.status) {
      setStatus(request.status);
    }
  }, [request]);

  const mutation = useMutation({
    mutationFn: (nextStatus: string) =>
      updateRequestStatus(id as string, nextStatus as RequestStatus),
    onSuccess: (_data, nextStatus) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests", id] });
      queryClient.invalidateQueries({ queryKey: ["activity", "request", id] });
      toast({
        title: "Status atualizado",
        description: "A solicitacao foi atualizada.",
      });
      if (request) {
        createActivityLog({
          entityType: "request",
          entityId: request.id,
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

  const createTaskMutation = useMutation({
    mutationFn: (values: TaskFormValues) =>
      createTask({
        title: values.title,
        dueAt: values.dueAt ? new Date(`${values.dueAt}T00:00:00`).toISOString() : null,
        requestId: id ?? null,
        createdBy: user?.id ?? null,
        assignedTo: user?.id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "request", id] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi adicionada a solicitacao.",
      });
      reset({ title: "", dueAt: "" });
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
      queryClient.invalidateQueries({ queryKey: ["tasks", "request", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Carregando solicitacao...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Solicitacao</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar os detalhes da solicitacao.
        </p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Solicitacao</h1>
        <p className="text-sm text-muted-foreground">Solicitacao nao encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Solicitacao</h1>
          <p className="text-muted-foreground">
            Recebida {formatRelativeTime(request.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/solicitacoes">Voltar</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={`/admin/orcamentos/novo?request=${request.id}`}>Criar orcamento</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados do cliente</CardTitle>
          <CardDescription>Informacoes de contato e detalhes do pedido</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="text-base font-semibold text-foreground">
                {request.client?.name ?? request.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="text-sm text-foreground">{request.email ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
              <p className="text-sm text-foreground">{request.whatsapp}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Canal</p>
              <p className="text-sm text-foreground">
                {sourceLabels[request.source] ?? request.source}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Projeto</p>
              <p className="text-sm text-foreground">{request.project_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faixa de investimento</p>
              <p className="text-sm text-foreground">
                {request.budget_estimate ? request.budget_estimate : "A definir"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prazo desejado</p>
              <p className="text-sm text-foreground">
                {request.desired_deadline ? request.desired_deadline : "Nao informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="review">Em analise</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mutation.mutate(status)}
                  disabled={!status || mutation.isPending}
                >
                  {mutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Badge className={cn("border-0", requestStatusStyles[request.status])}>
                  {requestStatusLabels[request.status]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-2">
            <p className="text-sm text-muted-foreground">Descricao</p>
            <p className="text-sm text-foreground">{request.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Propostas vinculadas</CardTitle>
          <CardDescription>Historico de orcamentos criados</CardDescription>
        </CardHeader>
        <CardContent>
          {request.quotes?.length ? (
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
                {request.quotes.map((quote) => (
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
              Nenhuma proposta vinculada.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tarefas da solicitacao</CardTitle>
          <CardDescription>Acompanhe follow-ups e pendencias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleSubmit((values) => createTaskMutation.mutate(values))}
            className="grid gap-4 md:grid-cols-3"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">Titulo</Label>
              <Input
                id="task-title"
                placeholder="Enviar proposta revisada"
                {...register("title", { required: true })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">Informe o titulo.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Prazo</Label>
              <Input id="task-due" type="date" {...register("dueAt")} />
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
                    <TableCell className="font-medium text-foreground">
                      {task.title}
                    </TableCell>
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

export default AdminRequestDetail;
