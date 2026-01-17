import { FileText, Send, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "1. Solicite",
    description: "Preencha o formulário com os detalhes do seu projeto em menos de 2 minutos.",
  },
  {
    icon: Send,
    title: "2. Receba",
    description: "Orçamento profissional enviado direto no seu WhatsApp com link exclusivo.",
  },
  {
    icon: CheckCircle,
    title: "3. Aprove",
    description: "Revise online e aprove com um clique. Simples assim.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Como funciona
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Três passos simples
          </h2>
          <p className="text-muted-foreground text-lg">
            Do primeiro contato à aprovação do orçamento, tudo acontece de forma rápida e organizada.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative text-center group"
              >
                {/* Connector Line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}

                {/* Icon */}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-secondary mb-6 group-hover:bg-accent/10 transition-colors duration-300">
                  <Icon className="h-10 w-10 text-accent" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
