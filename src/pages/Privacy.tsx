import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "1. Informações que coletamos",
    content:
      "Coletamos dados fornecidos diretamente por você ao solicitar um orçamento ou entrar em contato, além de informações técnicas para melhorar a experiência.",
    items: [
      "Nome, e-mail e WhatsApp informados no formulário.",
      "Detalhes sobre o projeto, prazos e faixa de investimento.",
      "Dados técnicos como IP, navegador e dispositivo.",
    ],
  },
  {
    title: "2. Como usamos seus dados",
    content:
      "Utilizamos as informações para responder às solicitações, preparar propostas e manter comunicação eficiente sobre o projeto.",
    items: [
      "Enviar orçamento e alinhamentos de escopo.",
      "Agendar reuniões e follow-ups.",
      "Melhorar nossos serviços e conteúdo.",
    ],
  },
  {
    title: "3. Compartilhamento e segurança",
    content:
      "Não vendemos seus dados. Compartilhamentos acontecem apenas quando necessários para a execução do serviço ou obrigação legal.",
    items: [
      "Provedores de e-mail e ferramentas de atendimento.",
      "Parceiros de pagamento quando aplicável.",
      "Autoridades legais mediante solicitação formal.",
    ],
  },
  {
    title: "4. Seus direitos",
    content:
      "Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.",
    items: [
      "Confirmar quais dados possuímos.",
      "Solicitar atualização ou remoção.",
      "Revogar consentimentos futuros.",
    ],
  },
];

const Privacy = () => {
  return (
    <>
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container-narrow">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Privacidade
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Política de Privacidade
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl">
            Transparência e respeito aos seus dados. Saiba como tratamos suas informações
            ao usar nossos serviços.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow space-y-8">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                {section.title}
              </h2>
              <p className="text-muted-foreground mb-4">{section.content}</p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-foreground mb-3">
              Precisa falar sobre seus dados?
            </h3>
            <p className="text-muted-foreground mb-5">
              Entre em contato e esclarecemos qualquer dúvida sobre privacidade e uso das
              informações.
            </p>
            <Link to="/solicitar-orcamento">
              <Button variant="hero">Solicitar orçamento</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Privacy;
