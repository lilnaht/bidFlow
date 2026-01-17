import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  createTemplate,
  fetchTemplates,
  updateTemplate,
  type TemplateRow,
} from "@/integrations/supabase/queries";

type TemplateFormValues = {
  name: string;
  serviceType: string;
  body: string;
  isActive: boolean;
};

const templateHints = [
  "{{client_name}}",
  "{{company_name}}",
  "{{quote_title}}",
  "{{quote_total}}",
  "{{quote_subtotal}}",
  "{{quote_discount}}",
  "{{items_table}}",
  "{{valid_until}}",
  "{{notes}}",
];

const AdminTemplates = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<TemplateFormValues>({
    defaultValues: {
      name: "",
      serviceType: "",
      body: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!editing) {
      reset({ name: "", serviceType: "", body: "", isActive: true });
      return;
    }

    reset({
      name: editing.name,
      serviceType: editing.service_type ?? "",
      body: editing.body,
      isActive: editing.is_active,
    });
  }, [editing, reset]);

  const mutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => {
      if (editing) {
        return updateTemplate({
          id: editing.id,
          name: values.name,
          serviceType: values.serviceType || null,
          body: values.body,
          isActive: values.isActive,
        });
      }

      return createTemplate({
        name: values.name,
        serviceType: values.serviceType || null,
        body: values.body,
        isActive: values.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: editing ? "Template atualizado" : "Template criado",
        description: "O modelo foi salvo com sucesso.",
      });
      setEditing(null);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Nao foi possivel salvar o template.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: TemplateFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Templates de proposta</h1>
        <p className="text-muted-foreground">
          Crie modelos por tipo de servico e use variaveis dinamicas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {editing ? "Editar template" : "Novo template"}
          </CardTitle>
          <CardDescription>Defina o texto base da proposta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome</Label>
                <Input id="template-name" placeholder="Template para sites" {...register("name", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Tipo de servico</Label>
                <Input id="template-type" placeholder="site, branding, consultoria" {...register("serviceType")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-body">Corpo do template</Label>
              <Textarea id="template-body" rows={8} {...register("body", { required: true })} />
              <p className="text-xs text-muted-foreground">
                Variaveis disponiveis: {templateHints.join(", ")}.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={Boolean(watch("isActive"))} onCheckedChange={(value) => setValue("isActive", value)} />
              <span className="text-sm text-muted-foreground">Template ativo</span>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar template"}
              </Button>
              {editing ? (
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Modelos cadastrados</CardTitle>
          <CardDescription>Edite ou desative templates existentes.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nao foi possivel carregar os templates.
            </div>
          ) : isLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum template cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium text-foreground">
                      {template.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.service_type ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.is_active ? "Ativo" : "Inativo"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(template)}>
                        Editar
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

export default AdminTemplates;
