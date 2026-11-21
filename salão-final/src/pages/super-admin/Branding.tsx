import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Upload, Save, Trash2, Palette, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { loadBranding, saveBranding, resizeImage, BrandingConfig } from "@/lib/brandingConfig";
import { toast } from "sonner";

interface ImageFieldProps {
  label: string;
  hint: string;
  value?: string;
  onChange: (v?: string) => void;
  maxDim: number;
  aspect?: "square" | "wide";
}

const ImageField = ({ label, hint, value, onChange, maxDim, aspect = "square" }: ImageFieldProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = async (file: File) => {
    try {
      const data = await resizeImage(file, maxDim);
      onChange(data);
    } catch {
      toast.error("Não foi possível processar a imagem");
    }
  };
  return (
    <div className="space-y-2 p-4 rounded-xl border bg-card/40">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Label className="text-sm font-medium" translate="no">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        </div>
        {value && (
          <Button size="sm" variant="ghost" onClick={() => onChange(undefined)} className="h-7 gap-1 text-xs">
            <Trash2 className="h-3 w-3" /> Remover
          </Button>
        )}
      </div>
      <div className={`relative rounded-lg border-2 border-dashed border-border/60 bg-muted/20 flex items-center justify-center overflow-hidden ${aspect === "wide" ? "aspect-[3/1]" : "aspect-square max-w-[160px]"}`}>
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-contain" translate="no" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}
      </div>
      <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => ref.current?.click()}>
        <Upload className="h-3.5 w-3.5" /> Carregar imagem
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const Branding = () => {
  const [cfg, setCfg] = useState<BrandingConfig>(loadBranding);

  const update = <K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveBranding(cfg);
    toast.success("Branding atualizado em toda a plataforma");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Branding & Aparência"
        subtitle="Gestão da identidade visual — preparado para white-label e múltiplas empresas"
        actions={
          <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Guardar Branding</Button>
        }
      />

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Identidade da Marca
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label translate="no">Nome da marca</Label>
            <Input value={cfg.brandName} onChange={e => update("brandName", e.target.value)} translate="no" />
          </div>
          <div className="space-y-2">
            <Label translate="no">Slogan</Label>
            <Input value={cfg.brandTagline} onChange={e => update("brandTagline", e.target.value)} translate="no" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logos">
        <TabsList>
          <TabsTrigger value="logos" className="gap-2"><Palette className="h-3.5 w-3.5" /> Logótipos</TabsTrigger>
          <TabsTrigger value="banners" className="gap-2"><ImageIcon className="h-3.5 w-3.5" /> Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="logos" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ImageField
              label="Logótipo da Landing Page"
              hint="Aparece no topo da página inicial pública. Máx. 512px."
              value={cfg.landingLogo}
              onChange={v => update("landingLogo", v)}
              maxDim={512}
            />
            <ImageField
              label="Logótipo do Login"
              hint="Aparece na tela de entrada. Máx. 512px."
              value={cfg.loginLogo}
              onChange={v => update("loginLogo", v)}
              maxDim={512}
            />
            <ImageField
              label="Logótipo do Cadastro"
              hint="Aparece na tela de registo. Máx. 512px."
              value={cfg.registerLogo}
              onChange={v => update("registerLogo", v)}
              maxDim={512}
            />
            <ImageField
              label="Logótipo do Rodapé"
              hint="Aparece no footer institucional. Máx. 512px."
              value={cfg.footerLogo}
              onChange={v => update("footerLogo", v)}
              maxDim={512}
            />
            <ImageField
              label="Favicon"
              hint="Ícone da aba do navegador. Máx. 128px."
              value={cfg.favicon}
              onChange={v => update("favicon", v)}
              maxDim={128}
            />
          </div>
        </TabsContent>

        <TabsContent value="banners" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ImageField
              label="Banner Hero"
              hint="Imagem de fundo da Landing Page. Máx. 1920px."
              value={cfg.heroBanner}
              onChange={v => update("heroBanner", v)}
              maxDim={1920}
              aspect="wide"
            />
            <ImageField
              label="Banner do Login"
              hint="Imagem de fundo do Login/Registo. Máx. 1920px."
              value={cfg.loginBanner}
              onChange={v => update("loginBanner", v)}
              maxDim={1920}
              aspect="wide"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-secondary/30">
        <CardContent className="pt-6 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">White-label ready:</strong> as imagens são aplicadas dinamicamente em toda a plataforma (Landing, Login, Cadastro, Footer, Favicon) sem alterar código. Estrutura preparada para storage backend e persistência centralizada da plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Branding;
