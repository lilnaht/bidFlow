import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Github, Instagram } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import logoMark from "../../../img/logo2.png";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { companyName, companyEmail, companyPhone, companyAddress } = useSettings();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-wide section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-accent/20">
                <img
                  src={logoMark}
                  alt={companyName ? `${companyName} logo` : "Logo"}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className="font-display text-xl font-bold">{companyName}</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Transforme contatos em clientes com orçamentos profissionais. 
              Simples, rápido e eficiente.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Navegação</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Portfólio
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Serviços
                </Link>
              </li>
              <li>
                <Link to="/solicitar-orcamento" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Solicitar Orçamento
                </Link>
              </li>
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h4 className="font-display font-semibold mb-4">Serviços</h4>
            <ul className="space-y-3">
              <li className="text-sm text-primary-foreground/70">Sites Institucionais</li>
              <li className="text-sm text-primary-foreground/70">Landing Pages</li>
              <li className="text-sm text-primary-foreground/70">Aplicações Web</li>
              <li className="text-sm text-primary-foreground/70">E-commerce</li>
              <li className="text-sm text-primary-foreground/70">Automações</li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4" />
                {companyEmail}
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4" />
                {companyPhone}
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <MapPin className="h-4 w-4" />
                {companyAddress}
              </li>
            </ul>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            (c) {currentYear} {companyName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacidade" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              Privacidade
            </Link>
            <Link to="/termos" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
