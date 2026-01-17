import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";

const projects = [
  {
    id: "1",
    title: "E-commerce ModaFit",
    description: "Loja virtual completa para marca de roupas fitness com checkout integrado, gestão de estoque e painel administrativo.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    tags: ["E-commerce", "Next.js", "Stripe", "Supabase"],
    result: "+150% em conversões",
    category: "E-commerce",
  },
  {
    id: "2",
    title: "Sistema Clínica Vida",
    description: "Aplicação web para gestão de consultórios com agendamentos online, prontuário eletrônico e faturamento integrado.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop",
    tags: ["SaaS", "React", "Supabase", "TypeScript"],
    result: "2.000+ consultas/mês",
    category: "Aplicação Web",
  },
  {
    id: "3",
    title: "Landing Page Fintech",
    description: "Página de alta conversão para startup financeira com foco em captação de leads e integração com CRM.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    tags: ["Landing Page", "Conversion", "A/B Test"],
    result: "32% taxa de conversão",
    category: "Landing Page",
  },
  {
    id: "4",
    title: "Portal Imobiliária Prime",
    description: "Site institucional com catálogo de imóveis, filtros avançados e integração com WhatsApp para contato direto.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    tags: ["Site Institucional", "React", "API Integration"],
    result: "+80% leads qualificados",
    category: "Site Institucional",
  },
  {
    id: "5",
    title: "Dashboard Analytics",
    description: "Painel de métricas em tempo real para e-commerce com visualização de vendas, estoque e comportamento de usuários.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    tags: ["Dashboard", "React", "Charts", "Real-time"],
    result: "Decisões 3x mais rápidas",
    category: "Aplicação Web",
  },
  {
    id: "6",
    title: "App Delivery Local",
    description: "Aplicação web progressiva para restaurante com cardápio digital, pedidos online e gestão de entregas.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
    tags: ["PWA", "E-commerce", "React", "Stripe"],
    result: "+200 pedidos/semana",
    category: "E-commerce",
  },
];

const Portfolio = () => {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 sm:py-20">
        <div className="container-wide">
          <div className="max-w-2xl">
            <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              Portfólio
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Projetos que entregam resultados
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Cada projeto é uma parceria. Conheça alguns trabalhos realizados 
              e os resultados alcançados.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/portfolio/${project.id}`}
                className="group block"
              >
                <article className="h-full rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-accent/30 hover:shadow-xl transition-all duration-300">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm">
                        {project.category}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                        <ExternalLink className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Result */}
                    <div className="pt-4 border-t border-border">
                      <span className="text-sm font-semibold text-success">
                        {project.result}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-secondary/50">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Quer um projeto assim?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Conte sobre sua ideia e receba um orçamento personalizado.
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

export default Portfolio;
