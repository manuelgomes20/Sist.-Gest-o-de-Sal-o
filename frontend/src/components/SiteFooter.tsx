import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Phone, MessageCircle, Clock, Instagram, Facebook, Linkedin, Youtube,
  Globe, ShieldCheck, ChevronRight, Sparkles,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { loadFooterConfig, saveFooterConfig, FooterConfig, DEFAULT_FOOTER_CONFIG } from "@/lib/footerConfig";
import BrandLogo, { useBrandingConfig } from "@/components/BrandLogo";
import { api } from "@/lib/api";

// TikTok inline icon (lucide doesn't ship one)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.42a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z"/>
  </svg>
);

const SiteFooter = () => {
  const [cfg, setCfg] = useState<FooterConfig>(loadFooterConfig);
  const branding = useBrandingConfig();

  useEffect(() => {
    const sync = () => setCfg(loadFooterConfig());
    window.addEventListener("storage", sync);
    window.addEventListener("footer-config-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("footer-config-updated", sync);
    };
  }, []);

  useEffect(() => {
    api.platform
      .setting("footer")
      .then((remote) => {
        if (remote && Object.keys(remote).length) {
          const merged = { ...DEFAULT_FOOTER_CONFIG, ...remote, sections: { ...DEFAULT_FOOTER_CONFIG.sections, ...(remote.sections || {}) } };
          saveFooterConfig(merged);
          setCfg(merged);
        }
      })
      .catch(() => {
        // Local cache remains available for development/offline use.
      });
  }, []);

  const s = cfg.sections;

  const socials = [
    { key: "instagram", icon: Instagram, url: cfg.social.instagram, label: "Instagram" },
    { key: "facebook", icon: Facebook, url: cfg.social.facebook, label: "Facebook" },
    { key: "linkedin", icon: Linkedin, url: cfg.social.linkedin, label: "LinkedIn" },
    { key: "tiktok", icon: TikTokIcon, url: cfg.social.tiktok, label: "TikTok" },
    { key: "youtube", icon: Youtube, url: cfg.social.youtube, label: "YouTube" },
  ].filter(x => x.url);

  return (
    <footer className="relative mt-16 bg-[hsl(220,30%,8%)] text-slate-300 overflow-hidden">
      {/* decorative gradient blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full blur-3xl"
             style={{ background: "radial-gradient(circle, hsl(350 65% 52% / 0.35), transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full blur-3xl"
             style={{ background: "radial-gradient(circle, hsl(35 80% 56% / 0.30), transparent 70%)" }} />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Top brand strip */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-10 border-b border-white/10">
          <div className="flex items-center gap-3">
            <BrandLogo variant="footer" className="h-10 w-auto drop-shadow" />
            <div>
              <p className="font-serif text-xl font-bold text-white" translate="no">{branding.brandName}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1" translate="no">
                <Sparkles className="h-3 w-3" /> {branding.brandTagline}
              </p>
            </div>
          </div>
          {s.social && socials.length > 0 && (
            <div className="flex items-center gap-2">
              {socials.map(({ key, icon: Icon, url, label }) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                   className="group h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_hsl(350_65%_52%/0.6)]">
                  <Icon className="h-4 w-4 text-slate-300 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          {/* About */}
          {s.about && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-semibold text-white">{cfg.about.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{cfg.about.description}</p>
              {cfg.about.mission && (
                <p className="text-xs italic text-slate-500 border-l-2 border-primary/60 pl-3">{cfg.about.mission}</p>
              )}
            </div>
          )}

          {/* Useful Links */}
          {s.links && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-semibold text-white">{cfg.links.title}</h3>
              <ul className="space-y-2">
                {cfg.links.items.map(l => (
                  <li key={l.label}>
                    <Link to={l.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                      <ChevronRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support */}
          {s.support && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-semibold text-white">{cfg.support.title}</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {cfg.support.email && (
                  <li><a href={`mailto:${cfg.support.email}`} className="flex items-start gap-2 hover:text-white transition-colors">
                    <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span className="break-all">{cfg.support.email}</span>
                  </a></li>
                )}
                {cfg.support.whatsapp && (
                  <li><a href={`https://wa.me/${cfg.support.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary shrink-0" />{cfg.support.whatsapp}
                  </a></li>
                )}
                {cfg.support.phone && (
                  <li><a href={`tel:${cfg.support.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone className="h-4 w-4 text-primary shrink-0" />{cfg.support.phone}
                  </a></li>
                )}
                {cfg.support.hours && (
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span>{cfg.support.hours}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* FAQs */}
          {s.faqs && cfg.faqs.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-semibold text-white">{cfg.faqs.title}</h3>
              <Accordion type="single" collapsible className="w-full">
                {cfg.faqs.items.map(f => (
                  <AccordionItem key={f.id} value={f.id} className="border-white/10">
                    <AccordionTrigger className="text-left text-sm text-slate-300 hover:text-white py-3 hover:no-underline">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-400 leading-relaxed">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        {/* Developer company strip */}
        {s.company && (
          <div className="border-t border-white/10 py-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center gap-4">
              {cfg.company.logoUrl ? (
                <img src={cfg.company.logoUrl} alt={cfg.company.name} className="h-12 w-12 rounded-xl object-cover bg-white/10 p-1" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">{cfg.company.title}</p>
                <p className="font-serif text-lg font-semibold text-white">{cfg.company.name}</p>
                {cfg.company.team && <p className="text-xs text-slate-400 mt-0.5 max-w-md">{cfg.company.team}</p>}
              </div>
            </div>
            {cfg.company.website && (
              <div className="md:text-right">
                <a href={cfg.company.website} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
                  <Globe className="h-4 w-4 text-primary" />
                  {cfg.company.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Bottom bar: policies + system info */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          {s.policies && (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {cfg.policies.items.map(p => (
                <Link key={p.label} to={p.href} className="hover:text-white transition-colors">{p.label}</Link>
              ))}
            </div>
          )}
          {s.system && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_hsl(152_70%_50%/0.8)] animate-pulse" />
                {cfg.system.status}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {cfg.system.version}
              </span>
              <span>{cfg.system.copyright}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
