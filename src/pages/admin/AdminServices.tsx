import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { createService, fetchServices, updateService, type ServiceRow } from "@/integrations/supabase/queries";
import { formatCurrency } from "@/lib/format";

type ServiceFormValues = {
  name: string;
  description: string;
  unit: string;
  serviceType: string;
  defaultPrice: string;
  defaultDeadlineText: string;
  isActive: boolean;
};

const AdminServices = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ServiceFormValues>({
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      serviceType: "",
      defaultPrice: "",
      defaultDeadlineText: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!editing) {
      reset({
        name: "",
        description: "",
        unit: "",
        serviceType: "",
        defaultPrice: "",
        defaultDeadlineText: "",
        isActive: true,
      });
      return;
    }

    reset({
      name: editing.name,
      description: editing.description ?? "",
      unit: editing.unit ?? "",
      serviceType: editing.service_type ?? "",
      defaultPrice: editing.default_price_cents
        ? (editing.default_price_cents / 100).toString()
        : "",
      defaultDeadlineText: editing.default_deadline_text ?? "",
      isActive: editing.is_active,
    });
  }, [editing, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const priceValue = Number(values.defaultPrice.replace(",", "."));
      const defaultPriceCents = Number.isFinite(priceValue) ? Math.round(priceValue * 100) : 0;

      if (editing) {
        return updateService({
          id: editing.id,
          name: values.name,
          description: values.description || null,
          unit: values.unit || null,
          serviceType: values.serviceType || null,
          defaultPriceCents,
          defaultDeadlineText: values.defaultDeadlineText || null,
          isActive: values.isActive,
        });
      }

      return createService({
        name: values.name,
        description: values.description || null,
        unit: values.unit || null,
        serviceType: values.serviceType || null,
        defaultPriceCents,
        defaultDeadlineText: values.defaultDeadlineText || null,
        isActive: values.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: editing ? "Servico atualizado" : "Servico criado",
        description: "Catalogo atualizado com sucesso.",
      });
      setEditing(null);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Nao foi possivel atualizar o catalogo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ServiceFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Catalogo de servicos</h1>
        <p className="text-muted-foreground">
          Padronize precos e itens para agilizar novos orcamentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {editing ? "Editar servico" : "Novo servico"}
          </CardTitle>
          <CardDescription>
            Preencha os campos para salvar no catalogo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service-name">Nome</Label>
              <Input id="service-name" placeholder="Desenvolvimento de site" {...register("name", { required: true })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="service-description">Descricao</Label>
              <Input id="service-description" placeholder="Detalhe o escopo" {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-unit">Unidade</Label>
              <Input id="service-unit" placeholder="pacote, hora, sprint" {...register("unit")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-type">Tipo de servico</Label>
              <Input id="service-type" placeholder="site, branding, consultoria" {...register("serviceType")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Preco padrao (R$)</Label>
              <Input id="service-price" type="number" step="0.01" {...register("defaultPrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-deadline">Prazo padrao</Label>
              <Input id="service-deadline" placeholder="6 semanas" {...register("defaultDeadlineText")} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={Boolean(watch("isActive"))} onCheckedChange={(value) => setValue("isActive", value)} />
              <span className="text-sm text-muted-foreground">Servico ativo</span>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar servico"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Itens cadastrados</CardTitle>
          <CardDescription>Atualize ou desative servicos do catalogo.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nao foi possivel carregar os servicos.
            </div>
          ) : isLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando servicos...
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhum servico cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servico</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Preco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium text-foreground">
                      {service.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.service_type ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.unit ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(service.default_price_cents)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.is_active ? "Ativo" : "Inativo"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(service)}>
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

export default AdminServices;
