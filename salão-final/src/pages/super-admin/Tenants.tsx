import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Eye, Power, PowerOff, Building2, Mail, Phone, MapPin, Calendar, Users,
  CreditCard, Download, MoreHorizontal, LogIn, Send, Copy, FileText, RefreshCw,
  CalendarPlus, XCircle, History, Clock,
} from "lucide-react";
import { mockTenants, type Tenant } from "@/data/superAdminData";
import { formatKz } from "@/data/mockData";
import {
  computeLifecycle, lifecycleLabel, lifecycleStyle, trafficLight,
  addDays, newEvent, eventLabel,
} from "@/lib/subscriptionEngine";
import { toast } from "sonner";

const CURRENT_USER = "Suporte GenOmni";

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ tenant: Tenant; action: "suspend" | "activate" | "cancel" } | null>(null);
  const [extendDialog, setExtendDialog] = useState<{ tenant: Tenant; days: number } | null>(null);

  // Computa lifecycle para todos os tenants (sem sobrescrever status armazenado)
  const enriched = useMemo(() => tenants.map(t => {
    const life = computeLifecycle({ storedStatus: t.status, nextBilling: t.nextBilling });
    return { tenant: t, lifecycle: life.status, daysLeft: life.daysLeft };
  }), [tenants]);

  const filtered = enriched.filter(({ tenant: t }) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.nif.includes(search) || t.owner.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPlan = planFilter === "all" || t.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Contadores de alertas
  const stats = useMemo(() => {
    const s = { expiring: 0, grace: 0, expired: 0, suspended: 0 };
    enriched.forEach(({ lifecycle }) => {
      if (lifecycle === "suspended") s.suspended++;
      else if (lifecycle === "expired") s.expired++;
      else if (lifecycle === "grace") s.grace++;
      else if (lifecycle === "expiring_soon") s.expiring++;
    });
    return s;
  }, [enriched]);

  const updateTenant = (id: string, patch: Partial<Tenant>, event?: ReturnType<typeof newEvent>) => {
    setTenants(prev => prev.map(t => t.id === id ? {
      ...t,
      ...patch,
      events: event ? [event, ...t.events] : t.events,
    } : t));
    if (selected?.id === id) {
      setSelected(prev => prev ? { ...prev, ...patch, events: event ? [event, ...prev.events] : prev.events } : prev);
    }
  };

  const handleRenew = (t: Tenant) => {
    const days = t.billingCycle === "yearly" ? 365 : 30;
    const newBilling = addDays(new Date().toISOString().slice(0, 10), days);
    updateTenant(t.id, { status: "active", nextBilling: newBilling },
      newEvent("renewed", CURRENT_USER, `Próxima cobrança: ${newBilling}`));
    toast.success(`${t.name} renovada até ${newBilling}`);
  };

  const handleExtend = () => {
    if (!extendDialog) return;
    const { tenant, days } = extendDialog;
    const newBilling = addDays(tenant.nextBilling, days);
    updateTenant(tenant.id, { nextBilling: newBilling },
      newEvent("extended", CURRENT_USER, `+${days} dias → ${newBilling}`));
    toast.success(`Prazo estendido em ${days} dias`);
    setExtendDialog(null);
  };

  const handleToggle = () => {
    if (!confirmAction) return;
    const { tenant, action } = confirmAction;
    if (action === "suspend") {
      updateTenant(tenant.id, { status: "suspended" }, newEvent("suspended", CURRENT_USER, "Suspensão manual"));
      toast.success("Empresa suspensa");
    } else if (action === "activate") {
      updateTenant(tenant.id, { status: "active" }, newEvent("reactivated", CURRENT_USER));
      toast.success("Empresa reativada");
    } else if (action === "cancel") {
      updateTenant(tenant.id, { status: "cancelled" }, newEvent("cancelled", CURRENT_USER, "Cancelamento manual"));
      toast.success("Empresa cancelada");
    }
    setConfirmAction(null);
  };

  const handleToggleAutoSuspend = (t: Tenant, value: boolean) => {
    updateTenant(t.id, { autoSuspend: value },
      newEvent("plan_changed", CURRENT_USER, value ? "Corte automático ativado" : "Corte automático desativado"));
    toast.success(value ? "Corte automático ativado" : "Corte automático desativado");
  };

  const handleImpersonate = (t: Tenant) => toast.success(`Acesso temporário concedido a ${t.name}`, { description: "Sessão registada na auditoria." });
  const handleEmail = (t: Tenant) => toast.success(`Email de cobrança enviado para ${t.email}`);
  const handleCopy = (t: Tenant) => { navigator.clipboard.writeText(`${t.name} • ${t.nif} • ${t.email}`); toast.success("Dados copiados"); };

  const handleExportCSV = () => {
    const headers = ["ID", "Nome", "NIF", "Plano", "Estado", "Dias Restantes", "Próx. Cobrança", "Auto-Suspend", "Receita"];
    const rows = filtered.map(({ tenant: t, lifecycle, daysLeft }) => [t.id, t.name, t.nif, t.plan, lifecycle, daysLeft, t.nextBilling, t.autoSuspend, t.monthlyRevenue].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "empresas.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} empresas exportadas`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Empresas Cadastradas" subtitle="Ciclo de vida, prazos e ações de assinatura" />

      {/* Cards de resumo do ciclo de vida */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <LifecycleStat label="A expirar (≤15d)" value={stats.expiring} color="text-amber-600" />
        <LifecycleStat label="Em tolerância" value={stats.grace} color="text-orange-600" />
        <LifecycleStat label="Expiradas" value={stats.expired} color="text-destructive" />
        <LifecycleStat label="Suspensas" value={stats.suspended} color="text-amber-600" />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Procurar por nome, NIF ou responsável..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="trial">Em Trial</SelectItem>
              <SelectItem value="suspended">Suspensas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="Essencial">Essencial</SelectItem>
              <SelectItem value="Profissional">Profissional</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} className="shrink-0">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Próx. cobrança</TableHead>
                  <TableHead>Tempo restante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ tenant: t, lifecycle, daysLeft }) => {
                  const light = trafficLight(daysLeft);
                  return (
                    <TableRow key={t.id} className={lifecycle === "expired" || lifecycle === "grace" ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.owner} • {t.nif}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{t.plan}</Badge></TableCell>
                      <TableCell className="text-xs capitalize">{t.billingCycle === "monthly" ? "Mensal" : "Anual"}</TableCell>
                      <TableCell className="text-sm font-mono">{t.nextBilling}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${light.color} ${daysLeft <= 5 ? "animate-pulse" : ""}`} />
                          <span className="text-xs font-medium">{light.label}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={lifecycleStyle[lifecycle]}>{lifecycleLabel[lifecycle]}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setSelected(t)} title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" title="Mais ações">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => handleRenew(t)} className="text-emerald-600">
                                <RefreshCw className="h-4 w-4" /> Renovar assinatura
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExtendDialog({ tenant: t, days: 7 })}>
                                <CalendarPlus className="h-4 w-4" /> Estender prazo
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleImpersonate(t)}>
                                <LogIn className="h-4 w-4" /> Acessar como empresa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEmail(t)}>
                                <Send className="h-4 w-4" /> Enviar cobrança
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopy(t)}>
                                <Copy className="h-4 w-4" /> Copiar dados
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.success(`Fatura gerada para ${t.name}`)}>
                                <FileText className="h-4 w-4" /> Gerar fatura
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {t.status !== "suspended" && t.status !== "cancelled" ? (
                                <DropdownMenuItem onClick={() => setConfirmAction({ tenant: t, action: "suspend" })} className="text-amber-600">
                                  <PowerOff className="h-4 w-4" /> Suspender acesso
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setConfirmAction({ tenant: t, action: "activate" })} className="text-emerald-600">
                                  <Power className="h-4 w-4" /> Reativar acesso
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setConfirmAction({ tenant: t, action: "cancel" })} className="text-destructive">
                                <XCircle className="h-4 w-4" /> Cancelar assinatura
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma empresa encontrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de detalhes + timeline */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {selected?.name}
            </DialogTitle>
            <DialogDescription>Ciclo de vida, dados e histórico de eventos</DialogDescription>
          </DialogHeader>
          {selected && (() => {
            const life = computeLifecycle({ storedStatus: selected.status, nextBilling: selected.nextBilling });
            const light = trafficLight(life.daysLeft);
            return (
              <div className="space-y-5 pt-2">
                {/* Painel de assinatura */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${light.color} ${life.daysLeft <= 5 ? "animate-pulse" : ""}`} />
                      <div>
                        <p className="text-sm font-semibold">{lifecycleLabel[life.status]}</p>
                        <p className="text-xs text-muted-foreground">{light.label} • {selected.billingCycle === "monthly" ? "Plano mensal" : "Plano anual"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={lifecycleStyle[life.status]}>{selected.plan}</Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`auto-${selected.id}`} className="text-xs cursor-pointer">
                        Corte automático após tolerância
                      </Label>
                    </div>
                    <Switch
                      id={`auto-${selected.id}`}
                      checked={selected.autoSuspend}
                      onCheckedChange={(v) => handleToggleAutoSuspend(selected, v)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => handleRenew(selected)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <RefreshCw className="h-3 w-3" /> Renovar agora
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setExtendDialog({ tenant: selected, days: 7 })}>
                      <CalendarPlus className="h-3 w-3" /> Estender prazo
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEmail(selected)}>
                      <Send className="h-3 w-3" /> Enviar cobrança
                    </Button>
                  </div>
                </div>

                {/* Info da empresa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Building2} label="NIF" value={selected.nif} />
                  <InfoRow icon={Users} label="Responsável" value={selected.owner} />
                  <InfoRow icon={Mail} label="Email" value={selected.email} />
                  <InfoRow icon={Phone} label="Telefone" value={selected.phone} />
                  <InfoRow icon={MapPin} label="Cidade" value={selected.city} />
                  <InfoRow icon={CreditCard} label="Receita / mês" value={formatKz(selected.monthlyRevenue)} />
                  <InfoRow icon={Calendar} label="Cadastro" value={selected.createdAt} />
                  <InfoRow icon={Calendar} label="Último acesso" value={selected.lastAccess} />
                </div>

                {/* Timeline de eventos */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Histórico de eventos</h4>
                    <Badge variant="outline" className="text-[10px]">{selected.events.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                    {selected.events.map(ev => (
                      <div key={ev.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/40 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-xs">{eventLabel[ev.type]}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(ev.at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">por {ev.by}{ev.note ? ` — ${ev.note}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Diálogo: estender prazo */}
      <Dialog open={!!extendDialog} onOpenChange={(o) => !o && setExtendDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Estender prazo</DialogTitle>
            <DialogDescription>
              Adicionar dias adicionais à próxima cobrança de <strong>{extendDialog?.tenant.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          {extendDialog && (
            <div className="space-y-3">
              <Label className="text-xs">Dias a adicionar</Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 7, 15, 30].map(d => (
                  <Button
                    key={d}
                    size="sm"
                    variant={extendDialog.days === d ? "default" : "outline"}
                    onClick={() => setExtendDialog({ ...extendDialog, days: d })}
                  >
                    +{d}d
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                max={365}
                value={extendDialog.days}
                onChange={(e) => setExtendDialog({ ...extendDialog, days: Math.max(1, Number(e.target.value) || 1) })}
              />
              <p className="text-xs text-muted-foreground">
                Nova data: <strong>{addDays(extendDialog.tenant.nextBilling, extendDialog.days)}</strong>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(null)}>Cancelar</Button>
            <Button onClick={handleExtend}>Confirmar extensão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "suspend" && "Suspender empresa?"}
              {confirmAction?.action === "activate" && "Reativar empresa?"}
              {confirmAction?.action === "cancel" && "Cancelar assinatura?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "suspend" && `"${confirmAction?.tenant.name}" perderá acesso imediato. Os dados serão preservados.`}
              {confirmAction?.action === "activate" && `"${confirmAction?.tenant.name}" voltará a ter acesso completo.`}
              {confirmAction?.action === "cancel" && `"${confirmAction?.tenant.name}" será marcada como cancelada. Esta ação fica registada na auditoria.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={confirmAction?.action !== "activate" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value || "—"}</p>
    </div>
  </div>
);

const LifecycleStat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <Card className="shadow-card">
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </CardContent>
  </Card>
);

export default Tenants;
