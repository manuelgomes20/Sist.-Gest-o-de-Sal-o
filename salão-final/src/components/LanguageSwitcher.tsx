import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const langs = [
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const LanguageSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const { i18n } = useTranslation();
  const current = langs.find(l => i18n.language?.startsWith(l.code)) || langs[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="gap-1.5" aria-label="Idioma">
          <Languages className="h-4 w-4" />
          {!compact && <span className="text-xs font-medium uppercase" translate="no">{current.code}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {langs.map(l => (
          <DropdownMenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)} translate="no">
            <span className="mr-2">{l.flag}</span> {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
