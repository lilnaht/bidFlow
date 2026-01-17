import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

const projects = [
  {
    id: "1",
    title: "E-commerce ModaFit",
    description: "Loja virtual completa com checkout integrado e gestão de estoque.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    tags: ["E-commerce", "Next.js", "Stripe"],
    result: "+150% em conversões",
  },
  {
    id: "2",
    title: "App Gestão Clínica",
    description: "Sistema web para agendamentos, prontuários e faturamento.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop",
    tags: ["SaaS", "React", "Supabase"],
    result: "2.000+ consultas/mês",
  },
  {
    id: "3",
    title: "Landing Page Fintech",
    description: "Página de alta conversão para captação de leads qualificados.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    tags: ["Landing Page", "Conversion", "A/B Test"],
    result: "32% taxa de conversão",
  },
];

export function PortfolioPreviewSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              Portfólio
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Projetos em destaque
            </h2>
          </div>
          <Link to="/portfolio">
            <Button variant="ghost" className="group">
              Ver todos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
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
                    {project.tags.map((tag) => (
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
  );
}
