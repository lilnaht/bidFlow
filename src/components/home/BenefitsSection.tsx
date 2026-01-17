import { 
  Zap, 
  Shield, 
  Clock, 
  MessageSquare, 
  FileCheck, 
  TrendingUp 
} from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Orçamentos em minutos",
    description: "Gere propostas profissionais rapidamente com templates prontos e cálculos automáticos.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp integrado",
    description: "Envie orçamentos direto pelo WhatsApp com link exclusivo e senha de acesso.",
  },
  {
    icon: Shield,
    title: "Acesso protegido",
    description: "Cada orçamento tem senha única. Só seu cliente vê os detalhes da proposta.",
  },
  {
    icon: FileCheck,
    title: "Aprovação com 1 clique",
    description: "Cliente aprova online com registro completo de data, hora e confirmação.",
  },
  {
    icon: Clock,
    title: "Histórico completo",
    description: "Acompanhe todas as solicitações, clientes e orçamentos em um só lugar.",
  },
  {
    icon: TrendingUp,
    title: "PDF profissional",
    description: "Gere PDFs elegantes automaticamente para cada orçamento criado.",
  },
];

export function BenefitsSection() {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Benefícios
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            O que você recebe
          </h2>
          <p className="text-muted-foreground text-lg">
            Ferramentas pensadas para agilizar seu trabalho e impressionar seus clientes.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="group p-6 lg:p-8 rounded-2xl bg-card border border-border/50 hover:border-accent/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-5 group-hover:bg-accent/20 transition-colors">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
