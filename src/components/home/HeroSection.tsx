import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "Orçamentos profissionais em minutos",
  "Envio direto pelo WhatsApp",
  "Aprovação online com 1 clique",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />

      <div className="container-wide relative py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Sistema completo de orçamentos
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 animate-slide-up">
            Feche projetos mais rápido com orçamentos profissionais em{" "}
            <span className="text-accent">poucos cliques</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-primary-foreground/80 leading-relaxed mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: "100ms" }}>
            Portfólio + painel de propostas: receba pedidos, gere orçamento com padrão profissional 
            e envie pelo WhatsApp com link e senha.
          </p>

          {/* Benefits */}
          <ul className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-10 animate-slide-up" style={{ animationDelay: "200ms" }}>
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Link to="/solicitar-orcamento">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Solicitar orçamento
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/portfolio">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                Ver portfólio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 100V60C240 20 480 0 720 0C960 0 1200 20 1440 60V100H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}
