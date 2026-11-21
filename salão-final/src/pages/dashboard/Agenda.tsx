import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAppointments, mockClients, mockEmployees, mockServices, formatKz } from "@/data/mockData";
import { Plus, ChevronLeft, ChevronRight, Edit, Trash2, Clock, Bell, CalendarDays, CalendarRange, LayoutGrid, CheckCircle2, RotateCcw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import FinalizeAppointmentDialog from "@/components/FinalizeAppointmentDialog";
import { salesEngine } from "@/lib/salesEngine";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};
const statusLabels: Record<string, string> = {
  confirmed: "Confirmado", pending: "Pendente", completed: "Concluído", cancelled: "Cancelado",
};
const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState("2026-04-04");
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [appointments, setAppointments] = useState(mockAppointments as Array<{ id: string; client: string; service: string; employee: string; date: string; time: string; status: string; price: number }>);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizeTarget, setFinalizeTarget] = useState<typeof appointments[0] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ client: "", service: "", employee: "", date: "2026-04-04", time: "09:00", status: "pending" as string, price: 0 });

  // Helpers for week/month
  const baseDate = new Date(selectedDate + "T12:00:00");
  const toIso = (d: Date) => d.toISOString().split("T")[0];
  const weekStart = (() => { const d = new Date(baseDate); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d; })();
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const monthGridStart = (() => { const d = new Date(monthStart); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d; })();
  const monthDays = Array.from({ length: 42 }, (_, i) => { const d = new Date(monthGridStart); d.setDate(d.getDate() + i); return d; });
  const weekdayLabels = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

  const shift = (delta: number) => {
    const d = new Date(baseDate);
    if (view === "day") d.setDate(d.getDate() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setSelectedDate(toIso(d));
  };

  const headerLabel = view === "day"
    ? baseDate.toLocaleDateString("pt-AO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : view === "week"
      ? `${weekDays[0].toLocaleDateString("pt-AO", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("pt-AO", { day: "numeric", month: "short", year: "numeric" })}`
      : baseDate.toLocaleDateString("pt-AO", { month: "long", year: "numeric" });

  const dayAppointments = appointments.filter((a) => a.date === selectedDate);

  // Notify upcoming appointments
  useEffect(() => {
    const upcoming = dayAppointments.filter(a => a.status === "confirmed" || a.status === "pending");
    if (upcoming.length > 0) {
      toast.info(`${upcoming.length} agendamento(s) hoje — próximo às ${upcoming.sort((a, b) => a.time.localeCompare(b.time))[0]?.time}`, { icon: <Bell className="h-4 w-4" />, duration: 4000 });
    }
  }, [selectedDate]);

  const openNew = () => { setEditingId(null); setForm({ client: "", service: "", employee: "", date: selectedDate, time: "09:00", status: "pending", price: 0 }); setDialogOpen(true); };
  const openEdit = (a: typeof appointments[0]) => { setEditingId(a.id); setForm({ client: a.client, service: a.service, employee: a.employee, date: a.date, time: a.time, status: a.status, price: a.price }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };

  const handleSave = () => {
    if (editingId) {
      setAppointments(prev => prev.map(a => a.id === editingId ? { ...a, ...form } : a));
      toast.success("Agendamento atualizado!");
    } else {
      setAppointments(prev => [...prev, { id: String(Date.now()), ...form }]);
      toast.success("Agendamento criado!");
    }
  };
  const handleDelete = () => {
    if (editingId && salesEngine.isFinalized(editingId)) {
      salesEngine.reverseAppointment(editingId);
      toast.info("Lançamentos estornados (caixa, estoque e comissão).");
    }
    setAppointments(prev => prev.filter(a => a.id !== editingId));
    toast.success("Agendamento removido!");
  };

  const openFinalize = (a: typeof appointments[0]) => { setFinalizeTarget(a); setFinalizeOpen(true); };
  const handleFinalized = () => {
    if (!finalizeTarget) return;
    setAppointments(prev => prev.map(a => a.id === finalizeTarget.id ? { ...a, status: "completed" } : a));
  };
  const handleReopen = (a: typeof appointments[0]) => {
    salesEngine.reverseAppointment(a.id);
    setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: "confirmed" } : x));
    toast.info("Atendimento reaberto e lançamentos estornados.");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" subtitle="Gerencie os agendamentos do salão" actions={
        <Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
      } />

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2 capitalize">
            <Clock className="h-4 w-4 text-primary" />
            {headerLabel}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week" | "month")}>
              <TabsList className="h-9">
                <TabsTrigger value="day" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Dia</TabsTrigger>
                <TabsTrigger value="week" className="gap-1.5"><CalendarRange className="h-3.5 w-3.5" />Semana</TabsTrigger>
                <TabsTrigger value="month" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Mês</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8" onClick={() => setSelectedDate(toIso(new Date()))}>Hoje</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* DAY VIEW */}
          {view === "day" && (
            <div className="space-y-0.5">
              {hours.map((hour) => {
                const apt = dayAppointments.filter((a) => a.time === hour);
                return (
                  <div key={hour} className="flex gap-4 py-3 border-b border-border/30 last:border-0">
                    <span className="text-xs font-medium text-muted-foreground w-12 shrink-0 pt-1 tabular-nums">{hour}</span>
                    <div className="flex-1 space-y-2">
                      {apt.length > 0 ? apt.map((a) => (
                        <div key={a.id} className="group flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/25 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                              {a.client.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{a.client}</p>
                              <p className="text-xs text-muted-foreground">{a.service} • {a.employee}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{formatKz(a.price)}</span>
                            <Badge variant="outline" className={`text-[10px] px-2 ${statusColors[a.status]}`}>{statusLabels[a.status]}</Badge>
                            {a.status !== "completed" && a.status !== "cancelled" && (
                              <Button size="sm" className="h-7 gradient-primary text-primary-foreground text-[11px] px-2" onClick={() => openFinalize(a)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Finalizar
                              </Button>
                            )}
                            {a.status === "completed" && (
                              <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" onClick={() => handleReopen(a)}>
                                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reabrir
                              </Button>
                            )}
                            <div className="hidden group-hover:flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="h-8 flex items-center"><span className="text-xs text-muted-foreground/40">—</span></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WEEK VIEW */}
          {view === "week" && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[60px_repeat(7,minmax(120px,1fr))] gap-px bg-border/40 rounded-lg overflow-hidden border border-border/40 min-w-[820px]">
                <div className="bg-card p-2" />
                {weekDays.map((d) => {
                  const isToday = toIso(d) === toIso(new Date());
                  const isSelected = toIso(d) === selectedDate;
                  return (
                    <button key={d.toISOString()} onClick={() => { setSelectedDate(toIso(d)); setView("day"); }}
                      className={`bg-card p-2 text-center hover:bg-primary/5 transition-colors ${isSelected ? "bg-primary/10" : ""}`}>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{weekdayLabels[(d.getDay() + 6) % 7]}</p>
                      <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</p>
                    </button>
                  );
                })}

                {hours.map((hour) => (
                  <>
                    <div key={`h-${hour}`} className="bg-card p-2 text-[10px] text-muted-foreground tabular-nums text-right">{hour}</div>
                    {weekDays.map((d) => {
                      const dayKey = toIso(d);
                      const apt = appointments.filter(a => a.date === dayKey && a.time === hour);
                      return (
                        <div key={`${dayKey}-${hour}`} className="bg-card p-1 min-h-[44px] space-y-1">
                          {apt.map(a => (
                            <button key={a.id} onClick={() => openEdit(a)}
                              className={`w-full text-left rounded-md px-1.5 py-1 border text-[10px] leading-tight ${statusColors[a.status]} hover:opacity-90`}>
                              <p className="font-semibold truncate">{a.client}</p>
                              <p className="truncate opacity-75">{a.service}</p>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )}

          {/* MONTH VIEW */}
          {view === "month" && (
            <div>
              <div className="grid grid-cols-7 gap-px mb-1">
                {weekdayLabels.map(l => (
                  <div key={l} className="text-[10px] uppercase tracking-wider text-muted-foreground text-center py-1">{l}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border/40 rounded-lg overflow-hidden border border-border/40">
                {monthDays.map((d) => {
                  const dayKey = toIso(d);
                  const inMonth = d.getMonth() === baseDate.getMonth();
                  const isToday = dayKey === toIso(new Date());
                  const isSelected = dayKey === selectedDate;
                  const apt = appointments.filter(a => a.date === dayKey);
                  return (
                    <button key={dayKey} onClick={() => { setSelectedDate(dayKey); setView("day"); }}
                      className={`bg-card min-h-[88px] p-1.5 text-left hover:bg-primary/5 transition-colors flex flex-col gap-1 ${!inMonth ? "opacity-40" : ""} ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}>
                      <span className={`text-xs font-semibold tabular-nums self-end ${isToday ? "h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center" : "text-foreground"}`}>{d.getDate()}</span>
                      <div className="space-y-0.5 flex-1 overflow-hidden">
                        {apt.slice(0, 3).map(a => (
                          <div key={a.id} className={`truncate rounded px-1 py-0.5 border text-[9px] ${statusColors[a.status]}`}>
                            {a.time} {a.client}
                          </div>
                        ))}
                        {apt.length > 3 && <div className="text-[9px] text-muted-foreground">+{apt.length - 3} mais</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Agendamento" : "Novo Agendamento"} onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={form.client} onValueChange={v => setForm(f => ({ ...f, client: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{mockClients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select value={form.service} onValueChange={v => { const s = mockServices.find(x => x.name === v); setForm(f => ({ ...f, service: v, price: s?.price || 0 })); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{mockServices.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={form.employee} onValueChange={v => setForm(f => ({ ...f, employee: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{mockEmployees.filter(e => e.type === "servico").map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Preço (Kz)</Label>
            <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
          </div>
        </div>
      </CrudDialog>

      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Agendamento" description="Tem certeza que deseja excluir este agendamento?" onSave={handleDelete} saveLabel="Excluir" variant="destructive">
        <p className="text-sm text-muted-foreground">Se este atendimento já foi finalizado, todos os lançamentos (caixa, estoque e comissão) serão estornados.</p>
      </CrudDialog>

      <FinalizeAppointmentDialog open={finalizeOpen} onOpenChange={setFinalizeOpen} appointment={finalizeTarget} onFinalized={handleFinalized} />
    </div>
  );
};

export default Agenda;
