export interface FooterLink { label: string; href: string }
export interface FooterFAQ { id: string; question: string; answer: string }
export interface FooterSocial { instagram: string; facebook: string; linkedin: string; tiktok: string; youtube: string }
export interface FooterSupport { email: string; whatsapp: string; phone: string; hours: string }
export interface FooterCompany { name: string; logoUrl: string; website: string; team: string }
export interface FooterPolicy { label: string; href: string }
export interface FooterSystemInfo { version: string; status: string; copyright: string }

export interface FooterSections {
  about: boolean;
  links: boolean;
  faqs: boolean;
  support: boolean;
  social: boolean;
  company: boolean;
  policies: boolean;
  system: boolean;
}

export interface FooterConfig {
  about: { title: string; description: string; mission: string };
  links: { title: string; items: FooterLink[] };
  faqs: { title: string; items: FooterFAQ[] };
  support: { title: string } & FooterSupport;
  social: { title: string } & FooterSocial;
  company: { title: string } & FooterCompany;
  policies: { title: string; items: FooterPolicy[] };
  system: { title: string } & FooterSystemInfo;
  sections: FooterSections;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  about: {
    title: "Sobre o Sistema",
    description: "GenOmni Salon é uma plataforma SaaS premium para gestão completa de salões de beleza, barbearias e estúdios estéticos.",
    mission: "Nossa missão é simplificar o dia a dia dos profissionais da beleza com tecnologia elegante, segura e intuitiva.",
  },
  links: {
    title: "Links Úteis",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Clientes", href: "/dashboard/clients" },
      { label: "Agendamentos", href: "/dashboard/agenda" },
      { label: "Serviços", href: "/dashboard/services" },
      { label: "Relatórios", href: "/dashboard/financial" },
      { label: "Planos", href: "/#planos" },
      { label: "Configurações", href: "/dashboard/settings" },
    ],
  },
  faqs: {
    title: "Perguntas Frequentes",
    items: [
      { id: "f1", question: "Como faço o cadastro do meu salão?", answer: "Clique em 'Cadastrar Empresa' e preencha os dados solicitados nos 2 passos do onboarding." },
      { id: "f2", question: "Posso cadastrar mais de um funcionário?", answer: "Sim, o administrador pode cadastrar quantos funcionários quiser, com cargos e comissões personalizadas." },
      { id: "f3", question: "Quais formas de pagamento são suportadas?", answer: "Multicaixa Express, TPA, transferência bancária e dinheiro em espécie (Kwanzas)." },
      { id: "f4", question: "Os meus dados estão seguros?", answer: "Sim. Utilizamos arquitetura multi-tenant com isolamento total e criptografia em trânsito e em repouso." },
    ],
  },
  support: {
    title: "Suporte",
    email: "suporte@genomni.ao",
    whatsapp: "+244 923 000 000",
    phone: "+244 222 000 000",
    hours: "Seg - Sex: 08h às 18h | Sáb: 09h às 13h",
  },
  social: {
    title: "Redes Sociais",
    instagram: "https://instagram.com/genomnisalon",
    facebook: "https://facebook.com/genomnisalon",
    linkedin: "https://linkedin.com/company/genomni",
    tiktok: "https://tiktok.com/@genomnisalon",
    youtube: "https://youtube.com/@genomnisalon",
  },
  company: {
    title: "Empresa Desenvolvedora",
    name: "GenOmni Technologies",
    logoUrl: "",
    website: "https://genomni.ao",
    team: "Construído com dedicação por uma equipa apaixonada por design e tecnologia em Angola.",
  },
  policies: {
    title: "Políticas",
    items: [
      { label: "Política de Privacidade", href: "/privacy" },
      { label: "Termos de Uso", href: "/terms" },
      { label: "Política de Cookies", href: "/cookies" },
    ],
  },
  system: {
    title: "Sistema",
    version: "v1.0.0",
    status: "Operacional",
    copyright: `© ${new Date().getFullYear()} GenOmni Salon. Todos os direitos reservados.`,
  },
  sections: {
    about: true, links: true, faqs: true, support: true,
    social: true, company: true, policies: true, system: true,
  },
};

const KEY = "genomni_footer_config";

export const loadFooterConfig = (): FooterConfig => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_FOOTER_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FOOTER_CONFIG, ...parsed, sections: { ...DEFAULT_FOOTER_CONFIG.sections, ...(parsed.sections || {}) } };
  } catch {
    return DEFAULT_FOOTER_CONFIG;
  }
};

export const saveFooterConfig = (config: FooterConfig) => {
  localStorage.setItem(KEY, JSON.stringify(config));
  window.dispatchEvent(new Event("footer-config-updated"));
};
