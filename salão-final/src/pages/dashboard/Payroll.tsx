import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEmployees, formatKz } from "@/data/mockData";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { payrollEngine, usePayroll } from "@/lib/payrollEngine";
import { Wallet, BadgeDollarSign, Banknote, Receipt, Plus, Trash2, CheckCircle2 } from "lucide-react";

const monthNow = () => new Date().toISOString().slice(0, 7);

const Payroll = () => {
  const [month, setMonth] = useState(monthNow());
  const advances = usePayroll(s => s.advances);
  const deductions = usePayroll(s => s.deductions);
  const runs = usePayroll(s => s.runs);

  const [advOpen, setAdvOpen] = useState(false);
  const [advForm, setAdvForm] = useState({ employeeId: "", value: 0, reason: "" });
  const [dedOpen, setDedOpen] = useState(false);
  const [dedForm, setDedForm] = useState({ employeeId: "", label: "", value: 0 });
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows = useMemo(() => mockEmployees.map(e => ({
    emp: e,
    calc: payrollEngine.compute({ id: e.id, name: e.name, salary: e.salary }, month),
    paid: payrollEngine.isPaid(e.id, month),
  })), [month, advances, deductions, runs]);

  const totals = rows.reduce((acc, r) => {
    acc.gross += r.calc.gross; acc.net += r.calc.net; acc.deductions += r.calc.totalDeductions;
    return acc;
  }, { gross: 0, net: 0, deductions: 0 });

  const handleAdvance = () => {
    const e = mockEmployees.find(x => x.id === advForm.employeeId);
    if (!e || advForm.value <= 0) { toast.error("Funcionário e valor obrigatórios"); return; }
    payrollEngine.addAdvance({ employeeId: e.id, employeeName: e.name, value: advForm.value, reason: advForm.reason });
    toast.success("Adiantamento registado e lançado no caixa");
    setAdvForm({ employeeId: "", value: 0, reason: "" });
  };
  const handleDeduction = () => {
    const e = mockEmployees.find(x => x.id === dedForm.employeeId);
    if (!e || dedForm.value <= 0 || !dedForm.label) { toast.error("Preencha todos os campos"); return; }
    payrollEngine.addDeduction({ employeeId: e.id, employeeName: e.name, month, label: dedForm.label, value: dedForm.value });
    toast.success("Desconto adicionado");
    setDedForm({ employeeId: "", label: "", value: 0 });
  };
  const handlePay = (employeeId: string) => {
    const e = mockEmployees.find(x => x.id === employeeId);
    if (!e) return;
    const run = payrollEngine.run({ id: e.id, name: e.name, salary: e.salary }, month);
    if (run) toast.success(`Folha paga — ${formatKz(run.net)} líquido`);
  };

  const detail = detailId ? rows.find(r => r.emp.id === detailId) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Folha Salarial" subtitle="Base + comissões − faltas, atrasos, adiantamentos, INSS e IRT" actions={
        <div className="flex gap-2">
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40" />
          <Button variant="outline" onClick={() => setAdvOpen(true)}><Plus className="h-4 w-4 mr-1" /> Adiantamento</Button>
          <Button variant="outline" onClick={() => setDedOpen(true)}><Plus className="h-4 w-4 mr-1" /> Desconto</Button>
        </div>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card"><CardContent className="p-5 flex items-center gap-4"><div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center"><BadgeDollarSign className="h-6 w-6 text-primary-foreground" /></div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Bruto</p><p className="text-xl font-bold">{formatKz(totals.gross)}</p></div></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5 flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center"><Receipt className="h-6 w-6 text-destructive" /></div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Descontos</p><p className="text-xl font-bold">{formatKz(totals.deductions)}</p></div></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-5 flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center"><Banknote className="h-6 w-6 text-emerald-600" /></div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Líquido a pagar</p><p className="text-xl font-bold">{formatKz(totals.net)}</p></div></CardContent></Card>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <CardTitle className="text-base font-serif flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Folha de {month}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead>Funcionário</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Comissões</TableHead>
                <TableHead className="text-right">Faltas/Atrasos</TableHead>
                <TableHead className="text-right">Adiantam.</TableHead>
                <TableHead className="text-right">INSS+IRT</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ emp, calc, paid }) => (
                <TableRow key={emp.id} className="hover:bg-secondary/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{emp.name.split(" ").map(n => n[0]).join("")}</div>
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground">{emp.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatKz(calc.base)}</TableCell>
                  <TableCell className="text-right text-primary font-semibold">{formatKz(calc.commissions)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatKz(calc.absenceDeduction + calc.lateDeduction)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatKz(calc.advances + calc.otherDeductions)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatKz(calc.inss + calc.irt)}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">{formatKz(calc.net)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setDetailId(emp.id)}>Detalhes</Button>
                      {paid ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Paga</Badge>
                      ) : (
                        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => handlePay(emp.id)}>Pagar</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* advances & deductions list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="border-b border-border/50"><CardTitle className="text-sm font-serif">Adiantamentos pendentes</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-1.5">
            {advances.filter(a => a.status === "pending").length === 0 && <p className="text-xs text-muted-foreground italic">Sem adiantamentos pendentes.</p>}
            {advances.filter(a => a.status === "pending").map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/30">
                <div><span className="font-medium">{a.employeeName}</span><span className="text-xs text-muted-foreground ml-2">{a.date}{a.reason ? ` · ${a.reason}` : ""}</span></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-destructive">−{formatKz(a.value)}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => payrollEngine.removeAdvance(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="border-b border-border/50"><CardTitle className="text-sm font-serif">Descontos manuais — {month}</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-1.5">
            {deductions.filter(d => d.month === month).length === 0 && <p className="text-xs text-muted-foreground italic">Sem descontos para este mês.</p>}
            {deductions.filter(d => d.month === month).map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/30">
                <div><span className="font-medium">{d.employeeName}</span><span className="text-xs text-muted-foreground ml-2">{d.label}</span></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-destructive">−{formatKz(d.value)}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => payrollEngine.removeDeduction(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* advance dialog */}
      <CrudDialog open={advOpen} onOpenChange={setAdvOpen} title="Novo Adiantamento" onSave={handleAdvance}>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={advForm.employeeId} onValueChange={v => setAdvForm(f => ({ ...f, employeeId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{mockEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Valor (Kz)</Label><Input type="number" value={advForm.value} onChange={e => setAdvForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Motivo</Label><Input value={advForm.reason} onChange={e => setAdvForm(f => ({ ...f, reason: e.target.value }))} placeholder="Opcional" /></div>
          <p className="text-[11px] text-muted-foreground">O valor será lançado imediatamente como saída no caixa e descontado da próxima folha.</p>
        </div>
      </CrudDialog>

      {/* deduction dialog */}
      <CrudDialog open={dedOpen} onOpenChange={setDedOpen} title="Novo Desconto Manual" onSave={handleDeduction}>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={dedForm.employeeId} onValueChange={v => setDedForm(f => ({ ...f, employeeId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{mockEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Descrição</Label><Input value={dedForm.label} onChange={e => setDedForm(f => ({ ...f, label: e.target.value }))} placeholder="Quebra de produto, multa, etc." /></div>
          <div className="space-y-2"><Label>Valor (Kz)</Label><Input type="number" value={dedForm.value} onChange={e => setDedForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
        </div>
      </CrudDialog>

      {/* detail dialog */}
      <CrudDialog open={!!detailId} onOpenChange={o => !o && setDetailId(null)} title={`Detalhe — ${detail?.emp.name || ""}`} onSave={() => setDetailId(null)} saveLabel="Fechar">
        {detail && (
          <div className="space-y-2 text-sm">
            <Row label="Salário base" value={formatKz(detail.calc.base)} />
            <Row label="Comissões" value={formatKz(detail.calc.commissions)} accent="primary" />
            <hr className="border-border/50" />
            <Row label={`Faltas (${detail.calc.absenceDays} dias)`} value={`−${formatKz(detail.calc.absenceDeduction)}`} accent="destructive" />
            <Row label={`Atrasos (${detail.calc.lateMinutes} min)`} value={`−${formatKz(detail.calc.lateDeduction)}`} accent="destructive" />
            <Row label="Adiantamentos" value={`−${formatKz(detail.calc.advances)}`} accent="destructive" />
            <Row label="Outros descontos" value={`−${formatKz(detail.calc.otherDeductions)}`} accent="destructive" />
            <Row label="INSS (3%)" value={`−${formatKz(detail.calc.inss)}`} accent="destructive" />
            <Row label="IRT" value={`−${formatKz(detail.calc.irt)}`} accent="destructive" />
            <hr className="border-border/50" />
            <Row label="Líquido a receber" value={formatKz(detail.calc.net)} accent="emerald" big />
          </div>
        )}
      </CrudDialog>
    </div>
  );
};

const Row = ({ label, value, accent, big }: { label: string; value: string; accent?: "primary" | "destructive" | "emerald"; big?: boolean }) => {
  const cls = accent === "primary" ? "text-primary" : accent === "destructive" ? "text-destructive" : accent === "emerald" ? "text-emerald-600" : "";
  return (
    <div className={`flex justify-between ${big ? "text-base font-bold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${cls}`}>{value}</span>
    </div>
  );
};

export default Payroll;
