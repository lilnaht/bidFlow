import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "1. Propostas e escopo",
    content:
      "Cada orçamento descreve entregas, prazos e valores. Alterações no escopo podem gerar ajustes no cronograma e investimento.",
  },
  {
    title: "2. Pagamentos",
    content:
      "As condições de pagamento são acordadas na proposta. O início do projeto depende da confirmação do primeiro pagamento.",
  },
  {
    title: "3. Prazos e entregas",
    content:
      "Os prazos são estimativas e podem variar conforme a agilidade no envio de conteúdo e feedbacks.",
  },
  {
    title: "4. Revisões",
    content:
      "Incluímos ciclos de revisão conforme a proposta. Revisões extras são avaliadas caso a caso.",
  },
  {
    title: "5. Cancelamento",
    content:
      "Cancelamentos podem ser solicitados a qualquer momento. Custos já incorridos não são reembolsáveis.",
  },
  {
    title: "6. Propriedade intelectual",
    content:
      "Após a quitação, os direitos do projeto final são transferidos ao cliente, exceto ferramentas e códigos reutilizáveis.",
  },
];

const Terms = () => {
  return (
    <>
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container-narrow">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Termos
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Termos de uso
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl">
            Estas condições definem como conduzimos projetos, propostas e entregas.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                {section.title}
              </h2>
              <p className="text-muted-foreground">{section.content}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-foreground mb-3">
              Precisa de um acordo específico?
            </h3>
            <p className="text-muted-foreground mb-5">
              Podemos ajustar o contrato para atender requisitos especiais do seu projeto.
            </p>
            <Link to="/solicitar-orcamento">
              <Button variant="hero">Falar sobre meu projeto</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Terms;
