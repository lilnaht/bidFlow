import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

export function CTASection() {
  return (
    <section className="section-padding bg-secondary/50">
      <div className="container-narrow">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 sm:p-12 lg:p-16 text-center">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-6">
              <MessageCircle className="h-8 w-8 text-accent" />
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Solicite seu orçamento agora e receba uma proposta profissional 
              direto no seu WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/solicitar-orcamento">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Solicitar orçamento
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                  Ver projetos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
