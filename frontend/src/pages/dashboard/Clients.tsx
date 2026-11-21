import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Users, CalendarIcon, MessageSquare, Sparkles, User, Phone, Mail, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isValidAngolaPhone } from "@/lib/validation";

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const dateValue = (d: Date) => format(d, "yyyy-MM-dd");
const emptyForm = { name: "", phone: "", email: "", serviceId: "", employeeId: "", appointmentDate: undefined as Date | undefined, appointmentTime: "", sendSms: true, notes: "" };

const Clients = () => {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [c, s, e] = await Promise.all([api.clients.list(), api.services.list(), api.employees.list()]);
    setClients(c || []); setServices(s || []); setEmployees(e || []);
  };
  useEffect(() => { load().catch((error: any) => toast.error(error.message || "Erro ao carregar clientes")); }, []);

  const filtered = useMemo(() => clients.filter((c) => String(c.name || "").toLowerCase().includes(search.toLowerCase())), [clients, search]);
  const serviceProfessionals = employees.filter(e => e.type === "servico");
  const selectedService = services.find(s => s.id === form.serviceId);

  const resetForm = () => setForm({ ...emptyForm, appointmentDate: new Date() });
  const openNew = () => { setEditingId(null); resetForm(); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditingId(c.id); setForm({ ...emptyForm, name: c.name || "", phone: c.phone || "", email: c.email || "", notes: c.notes || "", sendSms: false }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("Nome e telefone são obrigatórios"); return; }
    if (!isValidAngolaPhone(form.phone)) { toast.error("Telefone inválido. Use +244 923 456 789"); return; }
    if (!editingId && (!form.serviceId || !form.employeeId || !form.appointmentDate || !form.appointmentTime)) { toast.error("Selecione o serviço, profissional, data e hora da marcação"); return; }
    try {
      const clientPayload = { name: form.name, phone: form.phone, email: form.email || null, notes: form.notes };
      let client = null;
      if (editingId) client = await api.clients.update(editingId, clientPayload); else client = await api.clients.create(clientPayload);
      if (!editingId && selectedService && form.appointmentDate) {
        const employee = employees.find(e => e.id === form.employeeId);
        await api.appointments.create({ client_id: client?.id, service_id: selectedService.id, employee_id: employee?.id, start_at: `${dateValue(form.appointmentDate)}T${form.appointmentTime}:00`, status: "pending", price: selectedService.price });
      }
      setDialogOpen(false); await load();
      toast.success(editingId ? "Cliente atualizado!" : "Cliente cadastrado e marcação criada!");
      if (!editingId && form.sendSms) setTimeout(() => toast.success("SMS de confirmação registado", { description: `Para ${form.phone}` }), 600);
    } catch (error: any) { toast.error(error.message || "Erro ao guardar cliente"); }
  };

  const handleDelete = async () => { if (!editingId) return; await api.clients.delete(editingId); setDeleteOpen(false); await load(); toast.success("Cliente removido!"); };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="Gerencie sua base de clientes" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>} />
      <Card className="shadow-card overflow-hidden"><CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Users className="h-4 w-4 text-primary" /> {filtered.length} clientes</div><div className="relative max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" /></div></div></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-secondary/30"><TableHead>Nome</TableHead><TableHead className="hidden sm:table-cell">Telefone</TableHead><TableHead className="hidden md:table-cell">E-mail</TableHead><TableHead className="hidden lg:table-cell">Última Visita</TableHead><TableHead className="text-right">Visitas</TableHead><TableHead className="w-20" /></TableRow></TableHeader><TableBody>{filtered.map((c) => <TableRow key={c.id} className="group hover:bg-secondary/40 transition-colors"><TableCell><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">{String(c.name || "?").split(" ").map((n: string) => n[0]).join("")}</div><span className="font-medium">{c.name}</span></div></TableCell><TableCell className="hidden sm:table-cell text-muted-foreground">{c.phone}</TableCell><TableCell className="hidden md:table-cell text-muted-foreground">{c.email || "—"}</TableCell><TableCell className="hidden lg:table-cell text-muted-foreground">{c.last_visit ? new Date(c.last_visit).toLocaleDateString("pt-AO") : "—"}</TableCell><TableCell className="text-right font-semibold">{c.total_visits || 0}</TableCell><TableCell><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Cliente" : "Cadastro & Marcação"} description={editingId ? "Atualize os dados do cliente" : "Cadastre o cliente e agende o serviço dele em um só passo"} onSave={handleSave} saveLabel={editingId ? "Salvar" : "Cadastrar e Marcar"}><div className="space-y-6"><section className="space-y-4"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center"><User className="h-3.5 w-3.5 text-primary-foreground" /></div><h3 className="text-sm font-semibold">Perfil do Cliente</h3></div><div className="grid grid-cols-2 gap-4 pl-9"><div className="col-span-2 space-y-2"><Label>Nome completo *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Ana Silva" /></div><div className="space-y-2"><Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Telefone *</Label><Input type="tel" placeholder="+244 923 456 789" pattern="(?:\+?244)?\s?9[0-9]{2}\s?[0-9]{3}\s?[0-9]{3}" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div><div className="space-y-2"><Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div></div></section>{!editingId && <><section className="space-y-4 pt-2 border-t border-border/50"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-primary" /></div><h3 className="text-sm font-semibold">Marcação do Serviço</h3></div><div className="grid grid-cols-2 gap-4 pl-9"><div className="col-span-2 space-y-2"><Label>Serviço *</Label><Select value={form.serviceId} onValueChange={v => setForm(f => ({ ...f, serviceId: v }))}><SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger><SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} · {s.duration}min · {Number(s.price).toLocaleString("pt-AO")} Kz</SelectItem>)}</SelectContent></Select>{selectedService && <div className="flex flex-wrap gap-2 pt-1"><Badge variant="secondary" className="font-normal"><Clock className="h-3 w-3 mr-1" />{selectedService.duration} min</Badge><Badge variant="secondary" className="font-normal">{Number(selectedService.price).toLocaleString("pt-AO")} Kz</Badge><Badge variant="outline" className="font-normal">{selectedService.category}</Badge></div>}</div><div className="col-span-2 space-y-2"><Label>Profissional *</Label><Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}><SelectTrigger><SelectValue placeholder="Selecione um profissional" /></SelectTrigger><SelectContent>{serviceProfessionals.map(e => <SelectItem key={e.id} value={e.id}>{e.name} — {e.role}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Data *</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.appointmentDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{form.appointmentDate ? format(form.appointmentDate, "dd MMM yyyy", { locale: ptBR }) : "Escolher data"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={form.appointmentDate} onSelect={(d) => setForm(f => ({ ...f, appointmentDate: d }))} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus locale={ptBR} className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover></div><div className="space-y-2"><Label>Hora *</Label><Select value={form.appointmentTime} onValueChange={v => setForm(f => ({ ...f, appointmentTime: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div className="col-span-2 space-y-2"><Label>Observações</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div></div></section><section className="pt-2 border-t border-border/50"><div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20"><div className="flex items-start gap-3"><div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0"><MessageSquare className="h-4 w-4 text-primary" /></div><div className="space-y-1"><Label htmlFor="sms-toggle" className="cursor-pointer text-sm font-semibold">Enviar SMS de confirmação</Label><p className="text-xs text-muted-foreground">O cliente receberá uma mensagem no número informado com os detalhes da marcação.</p></div></div><Switch id="sms-toggle" checked={form.sendSms} onCheckedChange={(v) => setForm(f => ({ ...f, sendSms: v }))} /></div></section></>}</div></CrudDialog>
      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Cliente" description="Tem certeza que deseja excluir este cliente?" onSave={handleDelete} saveLabel="Excluir" variant="destructive"><p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p></CrudDialog>
    </div>
  );
};
export default Clients;
