import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Globe, 
  Rocket, 
  Smartphone, 
  ShoppingCart, 
  Cog, 
  Wrench,
  CheckCircle2
} from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Site Institucional",
    description: "Presença online profissional para sua empresa com design moderno e otimizado para resultados.",
    features: [
      "Design responsivo e personalizado",
      "SEO otimizado para Google",
      "Formulários de contato integrados",
      "Velocidade de carregamento otimizada",
    ],
    cta: "Ideal para empresas que querem fortalecer sua presença digital.",
  },
  {
    icon: Rocket,
    title: "Landing Page",
    description: "Páginas de alta conversão focadas em captar leads e vender produtos ou serviços específicos.",
    features: [
      "Copy persuasiva e validada",
      "Design focado em conversão",
      "Integração com ferramentas de marketing",
      "Testes A/B e otimização contínua",
    ],
    cta: "Perfeito para campanhas e lançamentos.",
  },
  {
    icon: Smartphone,
    title: "Aplicação Web",
    description: "Sistemas web completos para resolver problemas específicos do seu negócio.",
    features: [
      "Interface intuitiva e moderna",
      "Banco de dados robusto",
      "Autenticação e segurança",
      "Painel administrativo",
    ],
    cta: "Para quem precisa de um sistema sob medida.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce",
    description: "Lojas virtuais completas com checkout integrado e gestão de produtos e pedidos.",
    features: [
      "Checkout seguro (Stripe, PIX)",
      "Gestão de estoque automatizada",
      "Catálogo de produtos otimizado",
      "Integração com transportadoras",
    ],
    cta: "Venda online com confiança.",
  },
  {
    icon: Cog,
    title: "Automações e Integrações",
    description: "Conecte sistemas, automatize tarefas repetitivas e aumente a produtividade do seu time.",
    features: [
      "Integração entre sistemas",
      "Automação de processos",
      "APIs personalizadas",
      "Webhooks e notificações",
    ],
    cta: "Economize tempo e reduza erros.",
  },
  {
    icon: Wrench,
    title: "Manutenção e Suporte",
    description: "Mantenha seu site ou sistema sempre atualizado, seguro e funcionando perfeitamente.",
    features: [
      "Atualizações de segurança",
      "Backup automático",
      "Correção de bugs",
      "Suporte prioritário",
    ],
    cta: "Tranquilidade para focar no seu negócio.",
  },
];

const Services = () => {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 sm:py-20">
        <div className="container-wide">
          <div className="max-w-2xl">
            <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              Serviços
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Soluções digitais para cada necessidade
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Do site institucional ao sistema complexo, entrego projetos 
              que funcionam e trazem resultados.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="group p-6 lg:p-8 rounded-2xl bg-card border border-border/50 hover:border-accent/30 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 mb-6 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-7 w-7 text-accent" />
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA text */}
                  <p className="text-sm font-medium text-foreground mb-4 pt-4 border-t border-border">
                    {service.cta}
                  </p>

                  {/* Button */}
                  <Link to="/solicitar-orcamento" className="mt-auto">
                    <Button variant="outline" className="w-full group/btn">
                      Solicitar orçamento
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-secondary/30">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              Processo
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Como trabalho
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Um processo claro e organizado para entregas sem surpresas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { step: "01", title: "Briefing", desc: "Entendo sua necessidade e objetivos em uma conversa inicial." },
              { step: "02", title: "Proposta", desc: "Envio orçamento detalhado com escopo, prazo e investimento." },
              { step: "03", title: "Desenvolvimento", desc: "Executo o projeto com entregas parciais para feedback." },
              { step: "04", title: "Entrega", desc: "Projeto finalizado, testado e pronto para uso." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 p-6 rounded-xl bg-card border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="font-display font-bold text-accent">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Tem um projeto em mente?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Conte os detalhes e receba uma proposta personalizada em até 24 horas.
          </p>
          <Link to="/solicitar-orcamento">
            <Button variant="hero" size="xl">
              Solicitar orçamento
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default Services;
