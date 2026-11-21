import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Layers } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import {
  loadFooterConfig, saveFooterConfig, FooterConfig, DEFAULT_FOOTER_CONFIG,
} from "@/lib/footerConfig";
import { api } from "@/lib/api";

const sectionLabels: Record<keyof FooterConfig["sections"], string> = {
  about: "Sobre", links: "Links Úteis", faqs: "FAQs", support: "Suporte",
  social: "Redes Sociais", company: "Empresa", policies: "Políticas", system: "Sistema",
};

const FooterAdmin = () => {
  const [cfg, setCfg] = useState<FooterConfig>(loadFooterConfig);

  useEffect(() => {
    api.platform.setting("footer").then(remote => {
      if (remote && Object.keys(remote).length) setCfg({ ...DEFAULT_FOOTER_CONFIG, ...remote, sections: { ...DEFAULT_FOOTER_CONFIG.sections, ...(remote.sections || {}) } });
    }).catch(() => undefined);
  }, []);

  const update = <K extends keyof FooterConfig>(key: K, value: FooterConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: value }));

  const save = async () => { try { await api.platform.updateSetting("footer", cfg); saveFooterConfig(cfg); toast.success("Footer atualizado com sucesso!"); } catch (error: any) { toast.error(error.message || "Erro ao guardar footer"); } };
  const reset = async () => { try { await api.platform.updateSetting("footer", DEFAULT_FOOTER_CONFIG); setCfg(DEFAULT_FOOTER_CONFIG); saveFooterConfig(DEFAULT_FOOTER_CONFIG); toast.success("Configuração restaurada para o padrão"); } catch (error: any) { toast.error(error.message || "Erro ao restaurar footer"); } };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Gestão do Rodapé" subtitle="Personalize todas as informações exibidas no rodapé da plataforma" />

      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Seções Ativas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(cfg.sections) as Array<keyof FooterConfig["sections"]>).map(k => (
              <div key={k} className="flex items-center justify-between rounded-lg border bg-card p-3">
                <span className="text-sm">{sectionLabels[k]}</span>
                <Switch
                  checked={cfg.sections[k]}
                  onCheckedChange={v => update("sections", { ...cfg.sections, [k]: v })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start">
          <TabsTrigger value="about">Sobre</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
          <TabsTrigger value="social">Redes</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* SOBRE */}
        <TabsContent value="about">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título</Label><Input value={cfg.about.title} onChange={e => update("about", { ...cfg.about, title: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={3} value={cfg.about.description} onChange={e => update("about", { ...cfg.about, description: e.target.value })} /></div>
            <div><Label>Missão / Objetivo</Label><Textarea rows={2} value={cfg.about.mission} onChange={e => update("about", { ...cfg.about, mission: e.target.value })} /></div>
          </CardContent></Card>
        </TabsContent>

        {/* LINKS */}
        <TabsContent value="links">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título da Seção</Label><Input value={cfg.links.title} onChange={e => update("links", { ...cfg.links, title: e.target.value })} /></div>
            <div className="space-y-2">
              {cfg.links.items.map((l, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <Input placeholder="Rótulo" value={l.label} onChange={e => {
                    const items = [...cfg.links.items]; items[i] = { ...items[i], label: e.target.value };
                    update("links", { ...cfg.links, items });
                  }} />
                  <Input placeholder="/destino" value={l.href} onChange={e => {
                    const items = [...cfg.links.items]; items[i] = { ...items[i], href: e.target.value };
                    update("links", { ...cfg.links, items });
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => update("links", { ...cfg.links, items: cfg.links.items.filter((_, x) => x !== i) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("links", { ...cfg.links, items: [...cfg.links.items, { label: "Novo link", href: "/" }] })}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar link
              </Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* FAQs */}
        <TabsContent value="faqs">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título da Seção</Label><Input value={cfg.faqs.title} onChange={e => update("faqs", { ...cfg.faqs, title: e.target.value })} /></div>
            <div className="space-y-3">
              {cfg.faqs.items.map((f, i) => (
                <div key={f.id} className="rounded-lg border p-3 space-y-2 bg-card">
                  <div className="flex items-start gap-2">
                    <Input placeholder="Pergunta" value={f.question} onChange={e => {
                      const items = [...cfg.faqs.items]; items[i] = { ...items[i], question: e.target.value };
                      update("faqs", { ...cfg.faqs, items });
                    }} />
                    <Button variant="ghost" size="icon" onClick={() => update("faqs", { ...cfg.faqs, items: cfg.faqs.items.filter((_, x) => x !== i) })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Textarea rows={2} placeholder="Resposta" value={f.answer} onChange={e => {
                    const items = [...cfg.faqs.items]; items[i] = { ...items[i], answer: e.target.value };
                    update("faqs", { ...cfg.faqs, items });
                  }} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("faqs", { ...cfg.faqs, items: [...cfg.faqs.items, { id: `f${Date.now()}`, question: "", answer: "" }] })}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar FAQ
              </Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* SUPORTE */}
        <TabsContent value="support">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título</Label><Input value={cfg.support.title} onChange={e => update("support", { ...cfg.support, title: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>E-mail</Label><Input value={cfg.support.email} onChange={e => update("support", { ...cfg.support, email: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={cfg.support.whatsapp} onChange={e => update("support", { ...cfg.support, whatsapp: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={cfg.support.phone} onChange={e => update("support", { ...cfg.support, phone: e.target.value })} /></div>
              <div><Label>Horário de Atendimento</Label><Input value={cfg.support.hours} onChange={e => update("support", { ...cfg.support, hours: e.target.value })} /></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* REDES */}
        <TabsContent value="social">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título</Label><Input value={cfg.social.title} onChange={e => update("social", { ...cfg.social, title: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["instagram", "facebook", "linkedin", "tiktok", "youtube"] as const).map(k => (
                <div key={k}><Label className="capitalize">{k}</Label>
                  <Input placeholder={`https://${k}.com/...`} value={cfg.social[k]} onChange={e => update("social", { ...cfg.social, [k]: e.target.value })} />
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* EMPRESA */}
        <TabsContent value="company">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título da Seção</Label><Input value={cfg.company.title} onChange={e => update("company", { ...cfg.company, title: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Nome da Empresa</Label><Input value={cfg.company.name} onChange={e => update("company", { ...cfg.company, name: e.target.value })} /></div>
              <div><Label>Website</Label><Input value={cfg.company.website} onChange={e => update("company", { ...cfg.company, website: e.target.value })} /></div>
            </div>
            <div><Label>Logo (URL ou base64)</Label>
              <Input placeholder="https://..." value={cfg.company.logoUrl} onChange={e => update("company", { ...cfg.company, logoUrl: e.target.value })} />
              <input type="file" accept="image/*" className="mt-2 text-xs" onChange={e => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = () => update("company", { ...cfg.company, logoUrl: reader.result as string });
                reader.readAsDataURL(file);
              }} />
            </div>
            <div><Label>Equipe / Mensagem</Label><Textarea rows={2} value={cfg.company.team} onChange={e => update("company", { ...cfg.company, team: e.target.value })} /></div>
          </CardContent></Card>
        </TabsContent>

        {/* POLÍTICAS */}
        <TabsContent value="policies">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título</Label><Input value={cfg.policies.title} onChange={e => update("policies", { ...cfg.policies, title: e.target.value })} /></div>
            <div className="space-y-2">
              {cfg.policies.items.map((p, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <Input placeholder="Rótulo" value={p.label} onChange={e => {
                    const items = [...cfg.policies.items]; items[i] = { ...items[i], label: e.target.value };
                    update("policies", { ...cfg.policies, items });
                  }} />
                  <Input placeholder="/destino" value={p.href} onChange={e => {
                    const items = [...cfg.policies.items]; items[i] = { ...items[i], href: e.target.value };
                    update("policies", { ...cfg.policies, items });
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => update("policies", { ...cfg.policies, items: cfg.policies.items.filter((_, x) => x !== i) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("policies", { ...cfg.policies, items: [...cfg.policies.items, { label: "Nova política", href: "/" }] })}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar política
              </Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* SISTEMA */}
        <TabsContent value="system">
          <Card><CardContent className="pt-6 space-y-4">
            <div><Label>Título</Label><Input value={cfg.system.title} onChange={e => update("system", { ...cfg.system, title: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>Versão</Label><Input value={cfg.system.version} onChange={e => update("system", { ...cfg.system, version: e.target.value })} /></div>
              <div><Label>Status</Label><Input value={cfg.system.status} onChange={e => update("system", { ...cfg.system, status: e.target.value })} /></div>
              <div className="sm:col-span-1"><Label>Copyright</Label><Input value={cfg.system.copyright} onChange={e => update("system", { ...cfg.system, copyright: e.target.value })} /></div>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3 sticky bottom-4">
        <Button onClick={save} className="gap-2 shadow-lg"><Save className="h-4 w-4" /> Guardar Alterações</Button>
        <Button variant="outline" onClick={reset}>Restaurar padrão</Button>
      </div>
    </div>
  );
};

export default FooterAdmin;
