import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, UserCheck, Shield, KeyRound } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";
import { toast } from "sonner";
import { isValidAngolaPhone, passwordIssues } from "@/lib/validation";

type EmployeeType = "gerente" | "recepcionista" | "servico";
const roleOptions = [{ value: "gerente", label: "Gerente" }, { value: "recepcionista", label: "Recepcionista" }, { value: "servico", label: "Funcionário de Serviço" }];
const serviceRoles = ["Cabeleireira", "Cabeleireiro", "Barbeiro", "Manicure", "Pedicure", "Esteticista", "Maquiadora", "Trancista"];
const emptyForm = { name: "", role: "", type: "servico" as EmployeeType, phone: "", commission: 0, salary: 0, status: "active", email: "", password: "" };

const Employees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const needsAccount = form.type === "gerente" || form.type === "recepcionista";

  const load = async () => setEmployees(await api.employees.list());
  useEffect(() => { load().catch((error: any) => toast.error(error.message || "Erro ao carregar funcionários")); }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: any) => { setEditingId(e.id); setForm({ name: e.name || "", role: e.role || "", type: e.type || "servico", phone: e.phone || "", commission: Number(e.commission || 0), salary: Number(e.salary || 0), status: e.status || "active", email: e.email || "", password: "" }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    if (form.phone && !isValidAngolaPhone(form.phone)) { toast.error("Telefone inválido. Use +244 923 456 789"); return; }
    if (needsAccount && (!form.email || !form.password) && !editingId) { toast.error("E-mail e senha são obrigatórios para este cargo"); return; }
    if (needsAccount && form.password) {
      const issues = passwordIssues(form.password);
      if (issues.length) { toast.error(`Senha deve conter ${issues.join(", ")}`); return; }
    }
    const finalRole = form.type === "gerente" ? "Gerente" : form.type === "recepcionista" ? "Recepcionista" : form.role;
    const payload = { ...form, role: finalRole, password: form.password || undefined };
    try {
      if (editingId) await api.employees.update(editingId, payload); else await api.employees.create(payload);
      setDialogOpen(false);
      await load();
      toast.success(editingId ? "Funcionário atualizado!" : "Funcionário cadastrado!");
    } catch (error: any) { toast.error(error.message || "Erro ao guardar funcionário"); }
  };
  const handleDelete = async () => { if (!editingId) return; await api.employees.delete(editingId); setDeleteOpen(false); await load(); toast.success("Funcionário removido!"); };

  const typeLabel = (type: string) => type === "gerente" ? { label: "Gerente", className: "bg-purple-50 text-purple-700 border-purple-200" } : type === "recepcionista" ? { label: "Recepcionista", className: "bg-blue-50 text-blue-700 border-blue-200" } : { label: "Serviço", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };

  return (
    <div className="space-y-6">
      <PageHeader title="Funcionários" subtitle="Gerencie a equipa do salão" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Funcionário</Button>} />
      <Card className="shadow-card overflow-hidden"><CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 py-4"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><UserCheck className="h-4 w-4 text-primary" /> {employees.length} funcionários</div></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-secondary/30"><TableHead>Nome</TableHead><TableHead>Função</TableHead><TableHead>Tipo</TableHead><TableHead className="hidden sm:table-cell">Telefone</TableHead><TableHead className="text-right">Salário Base</TableHead><TableHead className="text-right">Comissão</TableHead><TableHead className="w-20" /></TableRow></TableHeader><TableBody>{employees.map((e) => { const tl = typeLabel(e.type); return <TableRow key={e.id} className="group hover:bg-secondary/40 transition-colors"><TableCell><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">{String(e.name || "?").split(" ").map((n: string) => n[0]).join("")}</div><div><span className="font-medium">{e.name}</span>{(e.type === "gerente" || e.type === "recepcionista") && e.email && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><KeyRound className="h-3 w-3" />{e.email}</p>}</div></div></TableCell><TableCell className="text-muted-foreground">{e.role}</TableCell><TableCell><Badge variant="outline" className={`text-[10px] px-2 ${tl.className}`}>{tl.label}</Badge></TableCell><TableCell className="hidden sm:table-cell text-muted-foreground">{e.phone}</TableCell><TableCell className="text-right font-semibold">{formatKz(e.salary)}</TableCell><TableCell className="text-right font-semibold">{e.commission > 0 ? `${e.commission}%` : "—"}</TableCell><TableCell><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>
      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Funcionário" : "Novo Funcionário"} onSave={handleSave}><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="col-span-2 space-y-2"><Label>Nome Completo *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div><div className="space-y-2"><Label>Tipo de Cargo *</Label><Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as EmployeeType, role: v === "gerente" ? "Gerente" : v === "recepcionista" ? "Recepcionista" : f.role }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>{form.type === "servico" && <div className="space-y-2"><Label>Função *</Label><Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{serviceRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>}<div className="space-y-2"><Label>Telefone</Label><Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+244 923 456 789" pattern="(?:\+?244)?\s?9[0-9]{2}\s?[0-9]{3}\s?[0-9]{3}" /></div><div className="space-y-2"><Label>Salário Base (Kz)</Label><Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))} /></div>{form.type === "servico" && <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} /></div>}</div>{needsAccount && <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4 space-y-3"><div className="flex items-center gap-2 text-sm font-medium text-primary"><Shield className="h-4 w-4" /> Conta de Acesso ao Sistema</div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.ao" /></div><div className="space-y-2"><Label>Senha {editingId ? "(deixe vazio para manter)" : "*"}</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} /></div></div><p className="text-[11px] text-muted-foreground">Mín. 8 caracteres, maiúscula, minúscula, número e símbolo.</p></CardContent></Card>}</div></CrudDialog>
      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Funcionário" description="Tem certeza?" onSave={handleDelete} saveLabel="Excluir" variant="destructive"><p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p></CrudDialog>
    </div>
  );
};
export default Employees;
