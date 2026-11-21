import { useEffect, useState } from "react";
import { loadBranding, BrandingConfig, applyFavicon } from "@/lib/brandingConfig";
import genomniLogo from "@/assets/genomni-logo.png";

type Variant = "landing" | "login" | "register" | "footer";

interface BrandLogoProps {
  variant?: Variant;
  className?: string;
  alt?: string;
}

const useBranding = () => {
  const [cfg, setCfg] = useState<BrandingConfig>(loadBranding);
  useEffect(() => {
    applyFavicon(cfg.favicon);
    const sync = () => setCfg(loadBranding());
    window.addEventListener("branding-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("branding-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [cfg.favicon]);
  return cfg;
};

export const useBrandingConfig = useBranding;

const BrandLogo = ({ variant = "landing", className = "h-9 w-auto", alt }: BrandLogoProps) => {
  const cfg = useBranding();
  const map: Record<Variant, string | undefined> = {
    landing: cfg.landingLogo,
    login: cfg.loginLogo,
    register: cfg.registerLogo,
    footer: cfg.footerLogo,
  };
  const src = map[variant] || cfg.landingLogo || genomniLogo;
  return <img src={src} alt={alt || cfg.brandName} className={className} translate="no" />;
};

export default BrandLogo;
