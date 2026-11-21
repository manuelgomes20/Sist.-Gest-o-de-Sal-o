import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MessageCircle, Globe, Instagram, Facebook, Save } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

interface ContactChannels {
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  instagram: string;
  facebook: string;
}

const channelFields = [
  { key: "email" as const, label: "E-mail de Suporte", icon: Mail, placeholder: "suporte@genomni.ao" },
  { key: "phone" as const, label: "Telefone", icon: Phone, placeholder: "+244 222 000 000" },
  { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, placeholder: "+244 923 000 000" },
  { key: "website" as const, label: "Website", icon: Globe, placeholder: "https://genomni.ao" },
  { key: "instagram" as const, label: "Instagram", icon: Instagram, placeholder: "@genomnisalon" },
  { key: "facebook" as const, label: "Facebook", icon: Facebook, placeholder: "facebook.com/genomnisalon" },
];

const SuperAdminSettings = () => {
  const [channels, setChannels] = useState<ContactChannels>(() => {
    const saved = localStorage.getItem("genomni_contact_channels");
    return saved ? JSON.parse(saved) : {
      email: "suporte@genomni.ao",
      phone: "+244 222 000 000",
      whatsapp: "+244 923 000 000",
      website: "https://genomni.ao",
      instagram: "@genomnisalon",
      facebook: "facebook.com/genomnisalon",
    };
  });

  const handleSave = () => {
    localStorage.setItem("genomni_contact_channels", JSON.stringify(channels));
    toast.success("Canais de contacto atualizados com sucesso!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Configurações da Plataforma" subtitle="Gerencie os dados gerais da plataforma GenOmni Salon" />

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" /> Canais de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure os canais de contacto que serão exibidos na landing page para os visitantes e clientes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {channelFields.map(cf => (
              <div key={cf.key} className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <cf.icon className="h-4 w-4 text-primary" />
                  {cf.label}
                </Label>
                <Input
                  value={channels[cf.key]}
                  onChange={e => setChannels(prev => ({ ...prev, [cf.key]: e.target.value }))}
                  placeholder={cf.placeholder}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 rounded-xl border bg-secondary/30">
            <p className="text-sm font-semibold mb-3">Pré-visualização (Landing Page)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {channelFields.filter(cf => channels[cf.key]).map(cf => (
                <div key={cf.key} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/30">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <cf.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{cf.label}</p>
                    <p className="text-xs font-medium truncate">{channels[cf.key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="shadow-sm gap-2">
            <Save className="h-4 w-4" /> Guardar Canais de Contacto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSettings;
