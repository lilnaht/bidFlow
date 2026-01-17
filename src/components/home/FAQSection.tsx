import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Quanto tempo leva para receber o orçamento?",
    answer: "Normalmente respondo em até 24 horas úteis. Projetos simples como landing pages podem ter orçamento no mesmo dia. Projetos mais complexos precisam de análise mais detalhada.",
  },
  {
    question: "Como funciona o pagamento?",
    answer: "O padrão é 50% na aprovação (entrada) e 50% na entrega. Para projetos maiores, podemos dividir em mais parcelas conforme o cronograma de entregas.",
  },
  {
    question: "O orçamento tem validade?",
    answer: "Sim, cada orçamento tem validade de 14 dias por padrão. Após esse período, valores podem ser reajustados conforme demanda e disponibilidade.",
  },
  {
    question: "Posso solicitar alterações no orçamento?",
    answer: "Claro! Após receber a proposta, você pode pedir ajustes no escopo, negociar valores ou tirar dúvidas diretamente pelo WhatsApp antes de aprovar.",
  },
  {
    question: "O que acontece depois que aprovo o orçamento?",
    answer: "Entro em contato para alinhar os próximos passos: contrato, cronograma detalhado e início do projeto após confirmação do pagamento da entrada.",
  },
  {
    question: "Vocês oferecem suporte após a entrega?",
    answer: "Sim! Todos os projetos incluem um período de suporte para ajustes e correções. Também oferecemos planos de manutenção para atualizações contínuas.",
  },
];

export function FAQSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-narrow">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            FAQ
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Tire suas dúvidas sobre o processo de orçamento e contratação.
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
              <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-accent py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
