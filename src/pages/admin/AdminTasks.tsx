import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { createTask, fetchTasks, updateTaskStatus } from "@/integrations/supabase/queries";
import { formatRelativeTime } from "@/lib/format";
import { taskPriorityLabels, taskStatusLabels, taskStatusStyles, type TaskPriority, type TaskStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

type NewTaskFormValues = {
  title: string;
  dueAt: string;
  priority: TaskPriority;
};

const AdminTasks = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewTaskFormValues>({
    defaultValues: {
      title: "",
      dueAt: "",
      priority: "medium",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: NewTaskFormValues) =>
      createTask({
        title: values.title,
        dueAt: values.dueAt ? new Date(`${values.dueAt}T00:00:00`).toISOString() : null,
        priority: values.priority,
        assignedTo: user?.id ?? null,
        createdBy: user?.id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi adicionada ao painel.",
      });
      reset({ title: "", dueAt: "", priority: "medium" });
    },
    onError: () => {
      toast({
        title: "Erro ao criar tarefa",
        description: "Nao foi possivel salvar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onMutate: ({ id }) => {
      setUpdatingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Status atualizado",
        description: "A tarefa foi atualizada.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Nao foi possivel alterar o status.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  const onSubmit = (values: NewTaskFormValues) => {
    if (!values.title.trim()) {
      return;
    }
    createMutation.mutate(values);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="font-display text-xl font-bold text-foreground">Tarefas</h1>
        <p className="text-sm text-muted-foreground">
          Nao foi possivel carregar as tarefas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Tarefas</h1>
        <p className="text-muted-foreground">
          Acompanhe pendencias e follow-ups da equipe.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Nova tarefa</CardTitle>
          <CardDescription>
            Crie rapidamente uma tarefa e atribua a voce.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" placeholder="Retornar cliente FinStart" {...register("title", { required: true })} />
              {errors.title && (
                <p className="text-sm text-destructive">Informe o titulo da tarefa.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueAt">Prazo</Label>
              <Input id="dueAt" type="date" {...register("dueAt")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end md:col-span-1">
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Lista de tarefas</CardTitle>
          <CardDescription>Atualize o status e acompanhe os prazos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando tarefas...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhuma tarefa cadastrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Relacionado</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const related =
                    task.quote?.title
                      ? `Orcamento: ${task.quote.title}`
                      : task.request?.project_type
                        ? `Solicitacao: ${task.request.project_type}`
                        : task.client?.name
                          ? `Cliente: ${task.client.name}`
                          : "Geral";
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground">{task.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{related}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.assignee?.full_name ?? task.assignee?.email ?? "Sem responsavel"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {taskPriorityLabels[task.priority]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("border-0", taskStatusStyles[task.status])}>
                            {taskStatusLabels[task.status]}
                          </Badge>
                          <Select
                            value={task.status}
                            onValueChange={(value) =>
                              statusMutation.mutate({
                                id: task.id,
                                status: value as TaskStatus,
                              })
                            }
                            disabled={updatingId === task.id}
                          >
                            <SelectTrigger className="h-8 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">A fazer</SelectItem>
                              <SelectItem value="doing">Em andamento</SelectItem>
                              <SelectItem value="done">Concluida</SelectItem>
                              <SelectItem value="blocked">Bloqueada</SelectItem>
                              <SelectItem value="canceled">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.due_at ? formatRelativeTime(task.due_at) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTasks;
