import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Lock, Unlock, Plus, ArrowUpRight, ArrowDownRight, Wallet, Layers } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ExportButton from "@/components/ExportButton";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { formatKz } from "@/lib/format";
import { api } from "@/lib/api";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";

const PAYMENT_METHODS = ["Dinheiro", "TPA", "Transferência", "Multicaixa Express", "Outro"];
type MovementForm = { description: string; value: number; type: "entrada" | "saida"; method: string };

const toDate = (value: string) => new Date(value).toISOString().split("T")[0];
const toTime = (value: string) => new Date(value).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });

const Cashier = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MovementForm>({ description: "", value: 0, type: "entrada", method: "Multicaixa Express" });

  const load = async () => {
    const [rows, sums] = await Promise.all([api.cashier.movements(), api.cashier.summary()]);
    setMovements(rows || []);
    setSummary({ entradas: sums?.entradas || 0, saidas: sums?.saidas || 0, saldo: sums?.saldo || 0 });
  };

  useEffect(() => {
    load().catch((error: any) => toast.error(error.message || "Erro ao carregar caixa"));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayItems = useMemo(() => movements.filter(m => toDate(m.created_at) === today), [movements, today]);
  const byMethod = useMemo(() => {
    const grouped: Record<string, { in: number; out: number }> = {};
    movements.forEach(m => {
      const key = m.method || "Outro";
      grouped[key] ||= { in: 0, out: 0 };
      if (m.type === "entrada") grouped[key].in += Number(m.value || 0);
      else grouped[key].out += Number(m.value || 0);
    });
    return grouped;
  }, [movements]);

  const handleSave = async () => {
    if (!form.description || form.value <= 0) {
      toast.error("Preencha descrição e valor.");
      return;
    }
    try {
      await api.cashier.createMovement(form);
      setDialogOpen(false);
      await load();
      toast.success("Movimentação registrada!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar movimentação");
    }
  };

  const toggleCashier = () => {
    const next = !isOpen;
    setIsOpen(next);
    toast.success(next ? "Caixa aberto!" : "Caixa fechado!");
  };

  const exportRows = movements.map(m => ({
    date: toDate(m.created_at),
    time: toTime(m.created_at),
    source: "Banco de dados",
    type: m.type,
    description: m.description,
    method: m.method,
    value: m.value,
  }));
  const exportColumns = [
    { header: "Data", key: "date" },
    { header: "Hora", key: "time" },
    { header: "Origem", key: "source" },
    { header: "Tipo", key: "type" },
    { header: "Descrição", key: "description" },
    { header: "Método", key: "method" },
    { header: "Valor", key: "value", format: "currency" as const },
  ];
  const exportSummary = [
    { label: "Entradas", value: formatKz(summary.entradas) },
    { label: "Saídas", value: formatKz(summary.saidas) },
    { label: "Saldo", value: formatKz(summary.saldo) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Caixa" subtitle="Lançamentos automáticos vindos da Agenda + manuais" actions={
        <div className="flex gap-2 flex-wrap">
          <ExportButton
            onExportCSV={() => exportToCSV({ title: "Relatório de Caixa - GenOmni Salon", subtitle: "Movimentações", columns: exportColumns, data: exportRows, summary: exportSummary, filename: "relatorio-caixa" })}
            onExportPDF={() => exportToPDF({ title: "Relatório de Caixa", subtitle: "Movimentações", columns: exportColumns, data: exportRows, summary: exportSummary, filename: "relatorio-caixa" })}
          />
          {isOpen && (
            <Button onClick={() => { setForm({ description: "", value: 0, type: "entrada", method: "Multicaixa Express" }); setDialogOpen(true); }} variant="outline" className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Movimentação
            </Button>
          )}
          <Button variant={isOpen ? "destructive" : "default"} onClick={toggleCashier}>
            {isOpen ? <><Lock className="mr-2 h-4 w-4" /> Fechar Caixa</> : <><Unlock className="mr-2 h-4 w-4" /> Abrir Caixa</>}
          </Button>
        </div>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Entradas", value: summary.entradas, icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Saídas", value: summary.saidas, icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Saldo Actual", value: summary.saldo, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
        ].map((item) => (
          <Card key={item.label} className="shadow-card overflow-hidden">
            <div className="h-1 gradient-primary" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}><item.icon className={`h-5 w-5 ${item.color}`} /></div>
              <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p><p className={`text-xl font-bold ${item.color}`}>{formatKz(item.value)}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(byMethod).length > 0 && (
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50"><CardTitle className="font-serif text-lg flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Fechamento por Método de Pagamento</CardTitle></CardHeader>
          <CardContent className="pt-4"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{Object.entries(byMethod).map(([m, b]) => {
            const net = b.in - b.out;
            return <div key={m} className="rounded-xl border border-border/50 p-3 bg-secondary/30"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m}</p><p className="text-base font-bold text-foreground tabular-nums">{formatKz(net)}</p><p className="text-[10px] text-muted-foreground mt-0.5">+{formatKz(b.in)} / -{formatKz(b.out)}</p></div>;
          })}</div></CardContent>
        </Card>
      )}

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50"><CardTitle className="font-serif text-lg flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Movimentações ({todayItems.length} hoje)</CardTitle></CardHeader>
        <CardContent className="pt-4">
          {movements.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sem movimentações ainda. Finalize um atendimento na Agenda para ver lançamentos automáticos.</p> : (
            <div className="space-y-2">{movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors border border-border/30">
                <div className="flex items-center gap-3"><div className={`h-9 w-9 rounded-full flex items-center justify-center ${m.type === "entrada" ? "bg-emerald-50" : "bg-destructive/10"}`}>{m.type === "entrada" ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}</div><div><p className="text-sm font-medium text-foreground">{m.description}</p><p className="text-xs text-muted-foreground">{toDate(m.created_at)} {toTime(m.created_at)} • {m.method}</p></div></div>
                <span className={`font-semibold text-sm ${m.type === "entrada" ? "text-emerald-600" : "text-destructive"}`}>{m.type === "entrada" ? "+" : "-"}{formatKz(m.value)}</span>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Nova Movimentação Manual" onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Tipo</Label><Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as MovementForm["type"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Valor (Kz)</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
          <div className="col-span-2 space-y-2"><Label>Método</Label><Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </CrudDialog>
    </div>
  );
};

export default Cashier;
