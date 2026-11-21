import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, Shield, Headphones, Mail, Phone, Send, Palette, ImageIcon, Upload } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { isValidAngolaPhone, isValidNif } from "@/lib/validation";

const permissionModules = [
  { key: "agenda", label: "Agenda" },
  { key: "clients", label: "Clientes" },
  { key: "employees", label: "Funcionários" },
  { key: "services", label: "Serviços" },
  { key: "financial", label: "Financeiro" },
  { key: "cashier", label: "Caixa" },
  { key: "commissions", label: "Comissões" },
  { key: "stock", label: "Estoque" },
  { key: "audit", label: "Auditoria" },
  { key: "settings", label: "Configurações" },
];

const weekdays = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

type DaySchedule = { active: boolean; open: string; close: string };
type WeekSchedule = Record<string, DaySchedule>;

const defaultSchedule: WeekSchedule = {
  seg: { active: true, open: "08:00", close: "18:00" },
  ter: { active: true, open: "08:00", close: "18:00" },
  qua: { active: true, open: "08:00", close: "18:00" },
  qui: { active: true, open: "08:00", close: "18:00" },
  sex: { active: true, open: "08:00", close: "18:00" },
  sab: { active: true, open: "09:00", close: "14:00" },
  dom: { active: false, open: "00:00", close: "00:00" },
};

const SettingsPage = () => {
  const [company, setCompany] = useState({ name: "", nif: "", phone: "", email: "", address: "", city: "Luanda", logo: "" });
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);


  const [tenantLogo, setTenantLogo] = useState<string | undefined>();

  const logoInputRef = useRef<HTMLInputElement>(null);

  const defaultRoles = {
    gerente: Object.fromEntries(permissionModules.map(m => [m.key, true])),
    recepcionista: Object.fromEntries(permissionModules.map(m => [m.key, ["agenda", "clients", "cashier"].includes(m.key)])),
    profissional: Object.fromEntries(permissionModules.map(m => [m.key, ["agenda", "clients", "commissions"].includes(m.key)])),
  };

  const [roles, setRoles] = useState(defaultRoles);
  const [supportForm, setSupportForm] = useState({ subject: "", message: "", priority: "normal" });
  const [contactChannels, setContactChannels] = useState({
    email: "suporte@genomni.ao", phone: "+244 222 000 000", whatsapp: "+244 923 000 000",
  });

  useEffect(() => {
    api.settings.get()
      .then((data) => {
        if (data.company) {
          setCompany({ city: "Luanda", logo: "", ...data.company });
          setTenantLogo(data.company.logo || undefined);
        }
        if (data.schedule && Object.keys(data.schedule).length) {
          setSchedule({ ...defaultSchedule, ...data.schedule });
        } else if (data.hours?.open || data.hours?.close) {
          setSchedule(prev => Object.fromEntries(Object.entries(prev).map(([key, day]) => [key, { ...day, open: data.hours.open || day.open, close: data.hours.close || day.close }])) as WeekSchedule);
        }
        if (data.roles) setRoles({ ...defaultRoles, ...data.roles });
      })
      .catch((error: any) => toast.error(error.message || "Erro ao carregar configurações"));
  }, []);

  useEffect(() => {
    api.platform.setting("contactChannels")
      .then(remote => setContactChannels(prev => ({ ...prev, ...(remote || {}) })))
      .catch(() => undefined);
  }, []);

  const togglePermission = (role: "gerente" | "recepcionista" | "profissional", module: string) => {
    setRoles(prev => ({
      ...prev,
      [role]: { ...prev[role], [module]: !prev[role][module] },
    }));
  };

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const saveSettings = async (nextCompany = company, nextSchedule = schedule, nextRoles = roles) => {
    if (!nextCompany.name.trim()) throw new Error("Nome do salão é obrigatório");
    if (!isValidNif(nextCompany.nif)) throw new Error("NIF inválido. Use 9 a 15 caracteres alfanuméricos");
    if (!isValidAngolaPhone(nextCompany.phone)) throw new Error("Telefone inválido. Use +244 923 456 789");
    const response = await api.settings.update({
      company: nextCompany,
      hours: { open: nextSchedule.seg.open, close: nextSchedule.seg.close },
      roles: nextRoles,
      schedule: nextSchedule,
    });
    if (response.company) setCompany({ city: "Luanda", ...response.company });
    if (response.roles) setRoles({ ...defaultRoles, ...response.roles });
    return response;
  };

  const handleSaveCompany = async () => {
    try {
      await saveSettings();
      toast.success("Dados da empresa salvos!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar dados da empresa");
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await saveSettings();
      toast.success("Horário de funcionamento salvo!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar horário");
    }
  };


  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const nextCompany = { ...company, logo: base64 };
        await saveSettings(nextCompany);
        setCompany(nextCompany);
        setTenantLogo(base64);
        toast.success("Logotipo guardado para a empresa.");
      } catch (error: any) {
        toast.error(error.message || "Erro ao guardar logotipo");
      }
    };
    reader.readAsDataURL(file);
  };

  const roleMeta = {
    gerente: { label: "Gerente", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    recepcionista: { label: "Recepcionista", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    profissional: { label: "Profissional", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Gerencie a sua empresa e sistema" />

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4 hidden sm:inline" /> Empresa</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="h-4 w-4 hidden sm:inline" /> Aparência</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4 hidden sm:inline" /> Permissões</TabsTrigger>
          <TabsTrigger value="support" className="gap-2"><Headphones className="h-4 w-4 hidden sm:inline" /> Suporte</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="font-serif text-lg flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome do Salão</Label><Input value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>NIF</Label><Input value={company.nif} onChange={e => setCompany(c => ({ ...c, nif: e.target.value }))} placeholder="123456789LA042" pattern="[0-9A-Za-z]{9,15}" /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input type="tel" value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} placeholder="+244 923 456 789" pattern="(?:\+?244)?\s?9[0-9]{2}\s?[0-9]{3}\s?[0-9]{3}" /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Endereço</Label><Input value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} /></div>
              <Button onClick={handleSaveCompany} className="shadow-sm">Salvar Alterações</Button>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="font-serif text-lg flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Horário de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Defina o horário de abertura e fecho para cada dia da semana.</p>
              <div className="space-y-2">
                {weekdays.map(day => (
                  <div key={day.key} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-secondary/20">
                    <Switch
                      checked={schedule[day.key].active}
                      onCheckedChange={(v) => updateDay(day.key, "active", v)}
                    />
                    <span className={`text-sm font-medium w-20 ${!schedule[day.key].active ? "text-muted-foreground line-through" : ""}`}>
                      {day.label}
                    </span>
                    {schedule[day.key].active ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={schedule[day.key].open}
                          onChange={e => updateDay(day.key, "open", e.target.value)}
                          className="w-28"
                        />
                        <span className="text-xs text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={schedule[day.key].close}
                          onChange={e => updateDay(day.key, "close", e.target.value)}
                          className="w-28"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveSchedule} className="shadow-sm">Salvar Horário</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Logo */}
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="font-serif text-lg flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Logotipo da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden bg-muted/30">
                  {tenantLogo ? (
                    <img src={tenantLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Envie o logotipo da sua empresa. Recomendamos imagens quadradas em PNG com fundo transparente.</p>
                  <Button variant="outline" onClick={() => logoInputRef.current?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> Carregar logotipo
                  </Button>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          {(["gerente", "recepcionista", "profissional"] as const).map(role => (
            <Card key={role} className="shadow-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {roleMeta[role].label}
                  </CardTitle>
                  <Badge variant="outline" className={roleMeta[role].badge}>
                    {Object.values(roles[role]).filter(Boolean).length}/{permissionModules.length} módulos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permissionModules.map(mod => (
                    <div key={mod.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                      <span className="text-sm font-medium">{mod.label}</span>
                      <Switch
                        checked={roles[role][mod.key]}
                        onCheckedChange={() => togglePermission(role, mod.key)}
                      />
                    </div>
                  ))}
                </div>
                <Button className="mt-4 shadow-sm" onClick={() => saveSettings().then(() => toast.success(`Permissões de ${roleMeta[role].label} salvas!`)).catch((error: any) => toast.error(error.message || "Erro ao salvar permissões"))}>
                  Salvar Permissões
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="font-serif text-lg flex items-center gap-2"><Headphones className="h-4 w-4 text-primary" /> Contactar Suporte</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input value={supportForm.subject} onChange={e => setSupportForm(f => ({ ...f, subject: e.target.value }))} placeholder="Descreva brevemente o problema" />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={supportForm.priority} onValueChange={v => setSupportForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea value={supportForm.message} onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))} placeholder="Descreva o problema ou a sua solicitação em detalhe..." rows={5} />
              </div>
              <Button onClick={() => api.settings.createSupportTicket(supportForm).then(() => { setSupportForm({ subject: "", message: "", priority: "normal" }); toast.success("Pedido enviado! Nossa equipe responderá em breve."); }).catch((error: any) => toast.error(error.message || "Erro ao enviar pedido"))} className="shadow-sm">
                <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="font-serif text-lg flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Canais de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Mail, label: "E-mail", value: contactChannels.email },
                  { icon: Phone, label: "Telefone", value: contactChannels.phone },
                  { icon: Headphones, label: "WhatsApp", value: contactChannels.whatsapp },
                ].filter(c => c.value).map(c => (
                  <div key={c.label} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/40 border border-border/30">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{c.label}</p>
                      <p className="text-sm font-medium text-foreground">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
