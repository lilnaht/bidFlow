import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Schema de validação
const requestSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  whatsapp: z.string()
    .min(10, "WhatsApp inválido")
    .max(20, "WhatsApp inválido")
    .regex(/^[\d\s\-\(\)\+]+$/, "WhatsApp deve conter apenas números")
    .trim(),
  projectType: z.string()
    .min(1, "Selecione o tipo de projeto"),
  description: z.string()
    .min(20, "Descreva um pouco mais sobre seu projeto (mínimo 20 caracteres)")
    .max(2000, "Descrição deve ter no máximo 2000 caracteres")
    .trim(),
  email: z.string()
    .email("E-mail inválido")
    .max(255, "E-mail deve ter no máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  budgetEstimate: z.string().optional(),
  desiredDeadline: z.string().optional(),
  // Honeypot field - should be empty
  website: z.string().max(0, ""),
});

type RequestFormData = z.infer<typeof requestSchema>;

const projectTypes = [
  { value: "site-institucional", label: "Site Institucional" },
  { value: "landing-page", label: "Landing Page" },
  { value: "aplicacao-web", label: "Aplicação Web / Sistema" },
  { value: "ecommerce", label: "E-commerce / Loja Virtual" },
  { value: "automacao", label: "Automação / Integração" },
  { value: "manutencao", label: "Manutenção / Suporte" },
  { value: "outro", label: "Outro" },
];

const budgetRanges = [
  { value: "ate-5k", label: "Até R$ 5.000" },
  { value: "5k-10k", label: "R$ 5.000 - R$ 10.000" },
  { value: "10k-20k", label: "R$ 10.000 - R$ 20.000" },
  { value: "20k-50k", label: "R$ 20.000 - R$ 50.000" },
  { value: "acima-50k", label: "Acima de R$ 50.000" },
  { value: "a-definir", label: "A definir" },
];

const RequestQuote = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!turnstileSiteKey || !captchaRef.current) {
      return;
    }

    const scriptId = "turnstile-script";
    const existing = document.getElementById(scriptId);
    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        if (window.turnstile) {
          window.turnstile.render(captchaRef.current as HTMLElement, {
            sitekey: turnstileSiteKey,
            callback: (token: string) => setCaptchaToken(token),
          });
        }
      };
    } else if (window.turnstile) {
      window.turnstile.render(captchaRef.current as HTMLElement, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => setCaptchaToken(token),
      });
    }
  }, [turnstileSiteKey]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      projectType: "",
      description: "",
      email: "",
      budgetEstimate: "",
      desiredDeadline: "",
      website: "", // honeypot
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    // Check honeypot
    if (data.website) {
      // Bot detected, silently fail
      setIsSubmitted(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("submit-request", {
        body: {
          name: data.name,
          email: data.email || null,
          whatsapp: data.whatsapp,
          projectType: data.projectType,
          description: data.description,
          budgetEstimate: data.budgetEstimate || null,
          desiredDeadline: data.desiredDeadline || null,
          captchaToken,
        },
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      toast({
        title: "Solicitacao enviada!",
        description: "Vou analisar e te respondo pelo WhatsApp em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container-narrow">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Link>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container-narrow">
            <div className="max-w-lg mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-4">
                Pedido enviado!
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Vou analisar os detalhes do seu projeto e te respondo pelo WhatsApp em breve. 
                Fique de olho nas mensagens!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/portfolio">
                  <Button variant="outline" size="lg">
                    Ver portfólio
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="default" size="lg">
                    Voltar ao início
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container-narrow">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
          
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Solicitar orçamento
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl">
            Preencha o formulário abaixo com os detalhes do seu projeto. 
            Respondo em até 24 horas pelo WhatsApp.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Dados de contato */}
              <div className="space-y-6">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Dados de contato
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Seu nome completo"
                      {...register("name")}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">
                      WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="whatsapp"
                      placeholder="(11) 99999-9999"
                      {...register("whatsapp")}
                      className={errors.whatsapp ? "border-destructive" : ""}
                    />
                    {errors.whatsapp && (
                      <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Honeypot - hidden from users */}
              <div className="hidden" aria-hidden="true">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </div>

              {turnstileSiteKey ? (
                <div className="rounded-lg border border-border/60 bg-card p-4">
                  <div ref={captchaRef} />
                </div>
              ) : null}

              {/* Sobre o projeto */}
              <div className="space-y-6">
                <h2 className="font-display text-xl font-bold text-foreground">
                  Sobre o projeto
                </h2>

                {/* Tipo de projeto */}
                <div className="space-y-2">
                  <Label htmlFor="projectType">
                    Tipo de projeto <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue("projectType", value)}>
                    <SelectTrigger className={errors.projectType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o tipo de projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectType && (
                    <p className="text-sm text-destructive">{errors.projectType.message}</p>
                  )}
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descreva seu projeto <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Conte sobre seu projeto: qual problema quer resolver? Quais funcionalidades precisa? Tem referências?"
                    rows={5}
                    {...register("description")}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Orçamento estimado */}
                  <div className="space-y-2">
                    <Label htmlFor="budgetEstimate">Orçamento estimado (opcional)</Label>
                    <Select onValueChange={(value) => setValue("budgetEstimate", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prazo */}
                  <div className="space-y-2">
                    <Label htmlFor="desiredDeadline">Prazo desejado (opcional)</Label>
                    <Input
                      id="desiredDeadline"
                      placeholder="Ex: 2 meses, até dezembro..."
                      {...register("desiredDeadline")}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar solicitação
                      <Send className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Ao enviar, você concorda em receber contato pelo WhatsApp sobre seu pedido.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default RequestQuote;
