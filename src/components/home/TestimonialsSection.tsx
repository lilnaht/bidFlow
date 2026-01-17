import { Star } from "lucide-react";

const testimonials = [
  {
    id: "1",
    name: "Marina Costa",
    role: "CEO, TechStart",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    content: "O processo foi incrivelmente rápido. Recebi o orçamento no WhatsApp, aprovei online e em duas semanas meu site estava no ar. Profissionalismo do início ao fim.",
    rating: 5,
  },
  {
    id: "2",
    name: "Ricardo Almeida",
    role: "Diretor, Clínica Vida",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "Precisávamos de um sistema de agendamentos urgente. A proposta veio detalhada, o preço justo e a entrega antes do prazo. Recomendo muito.",
    rating: 5,
  },
  {
    id: "3",
    name: "Juliana Santos",
    role: "Fundadora, ModaFit",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: "Meu e-commerce aumentou 150% em conversões após o redesign. O orçamento foi claro, sem surpresas, e o suporte pós-lançamento excelente.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-primary text-primary-foreground">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            O que dizem os clientes
          </h2>
          <p className="text-primary-foreground/70 text-lg">
            Histórias reais de quem já transformou suas ideias em projetos de sucesso.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="p-6 lg:p-8 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-primary-foreground/90 leading-relaxed mb-6">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-primary-foreground/60">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
