import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";

// Dados demo - Em produção viriam do backend
const projectsData: Record<string, {
  title: string;
  description: string;
  fullDescription: string;
  image: string;
  gallery: string[];
  tags: string[];
  result: string;
  category: string;
  client: string;
  duration: string;
  year: string;
  features: string[];
  testimonial?: {
    content: string;
    author: string;
    role: string;
  };
}> = {
  "1": {
    title: "E-commerce ModaFit",
    description: "Loja virtual completa para marca de roupas fitness.",
    fullDescription: "Desenvolvimento de e-commerce completo para a ModaFit, marca de roupas fitness femininas. O projeto incluiu design personalizado, checkout integrado com Stripe, gestão de estoque automatizada e painel administrativo para controle de vendas e pedidos.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    ],
    tags: ["E-commerce", "Next.js", "Stripe", "Supabase", "Tailwind CSS"],
    result: "+150% em conversões",
    category: "E-commerce",
    client: "ModaFit",
    duration: "8 semanas",
    year: "2024",
    features: [
      "Design responsivo e otimizado para mobile",
      "Checkout integrado com Stripe e PIX",
      "Gestão de estoque em tempo real",
      "Painel administrativo completo",
      "SEO otimizado e páginas rápidas",
      "Integração com transportadoras",
    ],
    testimonial: {
      content: "Meu e-commerce aumentou 150% em conversões após o redesign. O orçamento foi claro, sem surpresas, e o suporte pós-lançamento excelente.",
      author: "Juliana Santos",
      role: "Fundadora, ModaFit",
    },
  },
  "2": {
    title: "Sistema Clínica Vida",
    description: "Aplicação web para gestão de consultórios.",
    fullDescription: "Sistema completo de gestão para a Clínica Vida, incluindo agendamento online, prontuário eletrônico, faturamento integrado e relatórios gerenciais. A aplicação permite que pacientes agendem consultas online e recebam lembretes automáticos.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop",
    ],
    tags: ["SaaS", "React", "Supabase", "TypeScript", "Tailwind CSS"],
    result: "2.000+ consultas/mês",
    category: "Aplicação Web",
    client: "Clínica Vida",
    duration: "12 semanas",
    year: "2024",
    features: [
      "Agendamento online 24/7",
      "Prontuário eletrônico seguro",
      "Lembretes por WhatsApp e e-mail",
      "Faturamento e emissão de notas",
      "Dashboard com métricas",
      "Multi-usuários com permissões",
    ],
    testimonial: {
      content: "Precisávamos de um sistema de agendamentos urgente. A proposta veio detalhada, o preço justo e a entrega antes do prazo. Recomendo muito.",
      author: "Ricardo Almeida",
      role: "Diretor, Clínica Vida",
    },
  },
  "3": {
    title: "Landing Page Fintech",
    description: "Página de alta conversão para startup financeira.",
    fullDescription: "Landing page otimizada para conversão desenvolvida para startup fintech em fase de captação. Foco em copy persuasiva, design moderno e integração com ferramentas de marketing para nutrição de leads.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    ],
    tags: ["Landing Page", "React", "Conversion", "A/B Test", "Analytics"],
    result: "32% taxa de conversão",
    category: "Landing Page",
    client: "FinStart",
    duration: "3 semanas",
    year: "2024",
    features: [
      "Design focado em conversão",
      "Copy persuasiva e validada",
      "Formulário otimizado",
      "Integração com RD Station",
      "Testes A/B implementados",
      "Velocidade de carregamento < 2s",
    ],
  },
};

const PortfolioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const project = id ? projectsData[id] : null;

  if (!project) {
    return (
      <div className="section-padding container-wide text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Projeto não encontrado</h1>
        <Link to="/portfolio">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao portfólio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container-wide">
          <Link 
            to="/portfolio" 
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao portfólio
          </Link>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground">
              {project.category}
            </span>
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary-foreground/10 text-primary-foreground">
              {project.year}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {project.title}
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl">
            {project.description}
          </p>
        </div>
      </section>

      {/* Main Image */}
      <section className="bg-background -mt-4">
        <div className="container-wide">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Sobre o projeto
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {project.fullDescription}
                </p>
              </div>

              {/* Features */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Funcionalidades entregues
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gallery */}
              {project.gallery.length > 1 && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Galeria
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.gallery.map((img, index) => (
                      <div key={index} className="rounded-xl overflow-hidden">
                        <img
                          src={img}
                          alt={`${project.title} - Imagem ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonial */}
              {project.testimonial && (
                <div className="p-8 rounded-2xl bg-secondary/50 border border-border">
                  <blockquote className="text-lg text-foreground italic mb-4">
                    "{project.testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-foreground">{project.testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{project.testimonial.role}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Project Info Card */}
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">
                    Detalhes do projeto
                  </h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">Cliente</dt>
                      <dd className="font-medium text-foreground">{project.client}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Duração</dt>
                      <dd className="font-medium text-foreground">{project.duration}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Ano</dt>
                      <dd className="font-medium text-foreground">{project.year}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Resultado</dt>
                      <dd className="font-semibold text-success">{project.result}</dd>
                    </div>
                  </dl>
                </div>

                {/* Tags */}
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">
                    Tecnologias
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="p-6 rounded-2xl bg-primary text-primary-foreground">
                  <h3 className="font-display text-lg font-bold mb-2">
                    Quer algo parecido?
                  </h3>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Solicite um orçamento personalizado para seu projeto.
                  </p>
                  <Link to="/solicitar-orcamento">
                    <Button variant="hero" className="w-full">
                      Solicitar orçamento
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PortfolioDetail;
