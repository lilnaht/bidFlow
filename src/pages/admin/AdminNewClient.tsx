import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/integrations/supabase/queries";

type NewClientFormValues = {
  name: string;
  email: string;
  phone: string;
  segment: string;
};

const AdminNewClient = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewClientFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      segment: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cliente cadastrado",
        description: "O cliente foi salvo com sucesso.",
      });
      navigate(`/admin/clientes/${client.id}`);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Nao foi possivel cadastrar o cliente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: NewClientFormValues) => {
    mutation.mutate({
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      segment: values.segment || null,
      status: "negotiation",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Novo cliente</h1>
          <p className="text-muted-foreground">
            Registre as principais informacoes do cliente.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/clientes">Voltar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados do cliente</CardTitle>
          <CardDescription>Use essas informacoes para propostas futuras</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome do cliente</Label>
                <Input id="name" placeholder="Empresa ou pessoa" {...register("name", { required: true })} />
                {errors.name && (
                  <p className="text-sm text-destructive">Informe o nome do cliente.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" placeholder="contato@cliente.com" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(11) 99999-9999" {...register("phone")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="segment">Segmento</Label>
                <Input id="segment" placeholder="Saude, Moda, Fintech..." {...register("segment")} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar cliente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewClient;
