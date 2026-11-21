import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Package, Calendar, Bell, Save, Volume2, MoonStar } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { loadAlertsConfig, saveAlertsConfig, AlertsConfig } from "@/lib/alertsConfig";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Alerts = () => {
  const [cfg, setCfg] = useState<AlertsConfig>(loadAlertsConfig);

  useEffect(() => {
    api.alerts.config().then((remote) => {
      const local = loadAlertsConfig();
      const merged = {
        stock: { ...local.stock, ...(remote?.stock || {}) },
        appointments: { ...local.appointments, ...(remote?.appointments || {}) },
        quietHours: { ...local.quietHours, ...(remote?.quietHours || {}) },
      };
      saveAlertsConfig(merged);
      setCfg(merged);
    }).catch((error: any) => toast.error(error.message || "Erro ao carregar preferências de alertas"));
  }, []);

  const handleSave = async () => {
    try {
      await api.alerts.updateConfig(cfg);
      saveAlertsConfig(cfg);
      toast.success("Preferências de alertas guardadas");
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar preferências de alertas");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Alertas Inteligentes"
        subtitle="Configure notificações de stock baixo e agendamentos para a sua empresa"
        actions={<Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Guardar</Button>}
      />

      {/* Stock alerts */}
      <Card className="shadow-card">
        <CardHeader className="border-b bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-600" /> Alertas de Stock
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <Label className="cursor-pointer">Ativar alertas de stock baixo</Label>
            <Switch
              checked={cfg.stock.enabled}
              onCheckedChange={(v) => setCfg(p => ({ ...p, stock: { ...p.stock, enabled: v } }))}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Limiar de stock baixo (unidades)</Label>
              <Input
                type="number" min={1} max={100}
                value={cfg.stock.threshold}
                onChange={e => setCfg(p => ({ ...p, stock: { ...p.stock, threshold: Number(e.target.value) || 1 } }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Repetir alerta a cada (minutos)</Label>
              <Input
                type="number" min={1} max={1440}
                value={cfg.stock.repeatMinutes}
                onChange={e => setCfg(p => ({ ...p, stock: { ...p.stock, repeatMinutes: Number(e.target.value) || 1 } }))}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <Label className="text-sm cursor-pointer flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Pop-up visual</Label>
              <Switch checked={cfg.stock.popup} onCheckedChange={v => setCfg(p => ({ ...p, stock: { ...p.stock, popup: v } }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <Label className="text-sm cursor-pointer flex items-center gap-2"><Volume2 className="h-3.5 w-3.5" /> Som de alerta</Label>
              <Switch checked={cfg.stock.sound} onCheckedChange={v => setCfg(p => ({ ...p, stock: { ...p.stock, sound: v } }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment alerts */}
      <Card className="shadow-card">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Alertas de Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <Label className="cursor-pointer">Ativar alertas de agendamentos próximos</Label>
            <Switch
              checked={cfg.appointments.enabled}
              onCheckedChange={(v) => setCfg(p => ({ ...p, appointments: { ...p.appointments, enabled: v } }))}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Avisar com antecedência</Label>
              <span className="text-xs font-medium">{cfg.appointments.leadMinutes} min</span>
            </div>
            <Slider
              min={5} max={120} step={5}
              value={[cfg.appointments.leadMinutes]}
              onValueChange={([v]) => setCfg(p => ({ ...p, appointments: { ...p.appointments, leadMinutes: v } }))}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Repetir alerta a cada</Label>
              <span className="text-xs font-medium">{cfg.appointments.repeatMinutes} min</span>
            </div>
            <Slider
              min={1} max={30} step={1}
              value={[cfg.appointments.repeatMinutes]}
              onValueChange={([v]) => setCfg(p => ({ ...p, appointments: { ...p.appointments, repeatMinutes: v } }))}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <Label className="text-sm cursor-pointer flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Pop-up visual</Label>
              <Switch checked={cfg.appointments.popup} onCheckedChange={v => setCfg(p => ({ ...p, appointments: { ...p.appointments, popup: v } }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <Label className="text-sm cursor-pointer flex items-center gap-2"><Volume2 className="h-3.5 w-3.5" /> Som de alerta</Label>
              <Switch checked={cfg.appointments.sound} onCheckedChange={v => setCfg(p => ({ ...p, appointments: { ...p.appointments, sound: v } }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet hours */}
      <Card className="shadow-card">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-500/5 to-transparent">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <MoonStar className="h-4 w-4 text-indigo-500" /> Horário de Silêncio
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <Label className="cursor-pointer">Suspender alertas em determinado horário</Label>
            <Switch
              checked={cfg.quietHours.enabled}
              onCheckedChange={v => setCfg(p => ({ ...p, quietHours: { ...p.quietHours, enabled: v } }))}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Início</Label>
              <Input
                type="time" value={cfg.quietHours.start}
                onChange={e => setCfg(p => ({ ...p, quietHours: { ...p.quietHours, start: e.target.value } }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fim</Label>
              <Input
                type="time" value={cfg.quietHours.end}
                onChange={e => setCfg(p => ({ ...p, quietHours: { ...p.quietHours, end: e.target.value } }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
