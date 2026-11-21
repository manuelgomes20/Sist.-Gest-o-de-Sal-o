import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEmployees } from "@/data/mockData";
import { Clock, LogIn, LogOut, History, Settings as SettingsIcon, CheckCircle2, AlertTriangle, XCircle, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { attendanceEngine, AttendanceStatus, useAttendance } from "@/lib/attendanceEngine";

const statusMeta: Record<AttendanceStatus, { label: string; cls: string; icon: any }> = {
  present:   { label: "Presente",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  late:      { label: "Atrasado",   cls: "bg-amber-50 text-amber-700 border-amber-200",       icon: AlertTriangle },
  absent:    { label: "Falta",      cls: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  justified: { label: "Justificado",cls: "bg-blue-50 text-blue-700 border-blue-200",          icon: FileText },
  dayoff:    { label: "Folga",      cls: "bg-secondary text-muted-foreground border-border",  icon: Clock },
};

const today = () => new Date().toISOString().split("T")[0];

const Attendance = () => {
  const records = useAttendance(s => s.records);
  const settings = useAttendance(s => s.settings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string } | null>(null);
  const [statusForm, setStatusForm] = useState<{ status: AttendanceStatus; note: string }>({ status: "absent", note: "" });
  const [draft, setDraft] = useState(settings);

  const t = today();
  const employees = mockEmployees;

  const punch = (e: { id: string; name: string }) => {
    const r = attendanceEngine.punch(e.id, e.name);
    toast.success(r.checkOut ? `Saída registada às ${r.checkOut}` : `Entrada registada às ${r.checkIn}${r.lateMinutes ? ` (+${r.lateMinutes}min)` : ""}`);
  };

  const openStatus = (e: { id: string; name: string }) => {
    setStatusTarget(e);
    setStatusForm({ status: "absent", note: "" });
    setStatusOpen(true);
  };
  const saveStatus = () => {
    if (!statusTarget) return;
    attendanceEngine.setStatus(statusTarget.id, statusTarget.name, t, statusForm.status, statusForm.note);
    toast.success("Estado atualizado");
  };
  const saveSettings = () => {
    attendanceEngine.updateSettings(draft);
    toast.success("Configurações guardadas");
  };

  const recent = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 15);

  return (
    <div className="space-y-6">
      <PageHeader title="Ponto Eletrónico" subtitle={`Turno padrão: ${settings.shiftStart} · Tolerância ${settings.toleranceMinutes}min`} actions={
        <Button variant="outline" onClick={() => { setDraft(settings); setSettingsOpen(true); }}>
          <SettingsIcon className="mr-2 h-4 w-4" /> Configurar
        </Button>
      } />

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 py-4">
          <CardTitle className="text-base font-serif flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Hoje · {t}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead>Funcionário</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(e => {
                const rec = records.find(r => r.employeeId === e.id && r.date === t);
                const meta = rec ? statusMeta[rec.status] : null;
                return (
                  <TableRow key={e.id} className="group hover:bg-secondary/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{e.name.split(" ").map(n => n[0]).join("")}</div>
                        <div>
                          <p className="font-medium">{e.name}</p>
                          <p className="text-[11px] text-muted-foreground">{e.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{rec?.checkIn || "—"}{rec?.lateMinutes ? <span className="text-amber-600 text-xs ml-1">+{rec.lateMinutes}m</span> : null}</TableCell>
                    <TableCell className="tabular-nums">{rec?.checkOut || "—"}</TableCell>
                    <TableCell>
                      {meta ? <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge> : <span className="text-xs text-muted-foreground">Aguardando</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => punch(e)}>
                          {rec?.checkIn && !rec?.checkOut ? <><LogOut className="h-3.5 w-3.5 mr-1" /> Saída</> : <><LogIn className="h-3.5 w-3.5 mr-1" /> Entrada</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openStatus(e)}>Marcar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 py-4">
            <CardTitle className="text-base font-serif flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Histórico recente</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-1.5">
            {recent.map(r => {
              const m = statusMeta[r.status];
              return (
                <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/30">
                  <div>
                    <span className="font-medium">{r.employeeName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{r.date} · entrada {r.checkIn || "—"} · saída {r.checkOut || "—"}</span>
                    {r.note && <p className="text-[11px] text-muted-foreground italic">“{r.note}”</p>}
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <CrudDialog open={settingsOpen} onOpenChange={setSettingsOpen} title="Configurações de Ponto" onSave={saveSettings}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Início do turno</Label><Input type="time" value={draft.shiftStart} onChange={e => setDraft(d => ({ ...d, shiftStart: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Tolerância (min)</Label><Input type="number" value={draft.toleranceMinutes} onChange={e => setDraft(d => ({ ...d, toleranceMinutes: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Dias úteis/mês</Label><Input type="number" value={draft.workingDaysPerMonth} onChange={e => setDraft(d => ({ ...d, workingDaysPerMonth: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Horas/turno</Label><Input type="number" value={draft.shiftHours} onChange={e => setDraft(d => ({ ...d, shiftHours: Number(e.target.value) }))} /></div>
        </div>
      </CrudDialog>

      <CrudDialog open={statusOpen} onOpenChange={setStatusOpen} title={`Marcar — ${statusTarget?.name || ""}`} onSave={saveStatus}>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={statusForm.status} onValueChange={v => setStatusForm(f => ({ ...f, status: v as AttendanceStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="absent">Falta</SelectItem>
                <SelectItem value="justified">Justificado</SelectItem>
                <SelectItem value="dayoff">Folga</SelectItem>
                <SelectItem value="present">Presente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Input value={statusForm.note} onChange={e => setStatusForm(f => ({ ...f, note: e.target.value }))} placeholder="Atestado médico, etc." />
          </div>
        </div>
      </CrudDialog>
    </div>
  );
};

export default Attendance;
