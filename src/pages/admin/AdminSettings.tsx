import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { fetchSettings, upsertSettings } from "@/integrations/supabase/queries";

type SettingsFormValues = {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  monthlyGoal: string;
  proposalValidityDays: string;
  proposalLanguage: string;
  proposalTemplate: string;
  notifyNewRequests: boolean;
  notifyFollowup: boolean;
  notifyWeeklySummary: boolean;
};

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<SettingsFormValues>({
    defaultValues: {
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      monthlyGoal: "",
      proposalValidityDays: "14",
      proposalLanguage: "pt-BR",
      proposalTemplate: "modern",
      notifyNewRequests: true,
      notifyFollowup: true,
      notifyWeeklySummary: false,
    },
  });

  useEffect(() => {
    if (!settings) {
      return;
    }

    reset({
      companyName: settings.company_name ?? "",
      companyEmail: settings.company_email ?? "",
      companyPhone: settings.company_phone ?? "",
      companyAddress: settings.company_address ?? "",
      monthlyGoal: settings.monthly_goal_cents
        ? (settings.monthly_goal_cents / 100).toString()
        : "",
      proposalValidityDays: settings.proposal_validity_days.toString(),
      proposalLanguage: settings.proposal_language,
      proposalTemplate: settings.proposal_template,
      notifyNewRequests: settings.notify_new_requests,
      notifyFollowup: settings.notify_followup,
      notifyWeeklySummary: settings.notify_weekly_summary,
    });
  }, [reset, settings]);

  const mutation = useMutation({
    mutationFn: upsertSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Configuracoes salvas",
        description: "As preferencias foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Nao foi possivel atualizar as configuracoes.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    const monthlyGoalValue = Number(values.monthlyGoal.replace(",", "."));
    const monthlyGoalCents = Number.isFinite(monthlyGoalValue)
      ? Math.round(monthlyGoalValue * 100)
      : 0;

    mutation.mutate({
      company_name: values.companyName || null,
      company_email: values.companyEmail || null,
      company_phone: values.companyPhone || null,
      company_address: values.companyAddress || null,
      monthly_goal_cents: monthlyGoalCents,
      proposal_validity_days: Number(values.proposalValidityDays) || 14,
      proposal_language: values.proposalLanguage,
      proposal_template: values.proposalTemplate,
      notify_new_requests: values.notifyNewRequests,
      notify_followup: values.notifyFollowup,
      notify_weekly_summary: values.notifyWeeklySummary,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Configuracoes</h1>
        <p className="text-muted-foreground">
          Personalize o painel, dados da empresa e notificacoes.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          Nao foi possivel carregar as configuracoes atuais.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Perfil da empresa</CardTitle>
            <CardDescription>Informacoes usadas nos orcamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome comercial</Label>
              <Input
                id="company-name"
                placeholder="bidFlow"
                {...register("companyName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">E-mail principal</Label>
              <Input
                id="company-email"
                placeholder="contato@proorcamento.com"
                {...register("companyEmail")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">WhatsApp</Label>
              <Input id="company-phone" placeholder="(11) 99999-9999" {...register("companyPhone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Endereco</Label>
              <Textarea id="company-address" rows={3} placeholder="Sao Paulo, SP" {...register("companyAddress")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Preferencias de proposta</CardTitle>
            <CardDescription>Padronize prazos e comunicacao</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-goal">Meta mensal (R$)</Label>
              <Input
                id="monthly-goal"
                type="number"
                step="0.01"
                placeholder="120000"
                {...register("monthlyGoal")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-validity">Validade padrao</Label>
              <Controller
                control={control}
                name="proposalValidityDays"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="proposal-validity">
                      <SelectValue placeholder="Selecione a validade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
                      <SelectItem value="21">21 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-language">Idioma das propostas</Label>
              <Controller
                control={control}
                name="proposalLanguage"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="proposal-language">
                      <SelectValue placeholder="Portuguese (Brasil)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Portuguese (Brasil)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Espanol</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-template">Template visual</Label>
              <Controller
                control={control}
                name="proposalTemplate"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="proposal-template">
                      <SelectValue placeholder="Proposta moderna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Proposta moderna</SelectItem>
                      <SelectItem value="classic">Classico corporativo</SelectItem>
                      <SelectItem value="minimal">Minimalista</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Notificacoes</CardTitle>
          <CardDescription>Controle como voce recebe alertas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Carregando preferencias...
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Novas solicitacoes por e-mail</p>
                  <p className="text-sm text-muted-foreground">
                    Aviso imediato quando alguem enviar o formulario.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="notifyNewRequests"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Lembretes de follow-up</p>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas apos 48h sem retorno.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="notifyFollowup"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Resumo semanal</p>
                  <p className="text-sm text-muted-foreground">
                    Relatorio com metricas e status do funil.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="notifyWeeklySummary"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
};

export default AdminSettings;
