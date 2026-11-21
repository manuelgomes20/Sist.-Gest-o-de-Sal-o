import { useState } from "react";
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
import { formatKz } from "@/data/mockData";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";
import { PAYMENT_METHODS, PaymentMethod, salesEngine, useSalesEngine } from "@/lib/salesEngine";

const Cashier = () => {
  const movements = useSalesEngine(s => s.movements);
  const openingBalance = useSalesEngine(s => s.openingBalance);
  const [isOpen, setIsOpen] = useState(salesEngine.isOpen());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<{ description: string; value: number; type: "in" | "out"; method: PaymentMethod }>({
    description: "", value: 0, type: "in", method: "Multicaixa Express",
  });

  const today = new Date().toISOString().split("T")[0];
  const summary = salesEngine.getCashSummary(); // all-time for visibility (mock)
  const todaySummary = salesEngine.getCashSummary(today);

  const handleSave = () => {
    if (!form.description || form.value <= 0) {
      toast.error("Preencha descrição e valor.");
      return;
    }
    salesEngine.addManualMovement(form);
    toast.success("Movimentação registrada!");
  };

  const toggleCashier = () => {
    const next = !isOpen;
    salesEngine.setOpen(next);
    setIsOpen(next);
    toast.success(next ? "Caixa aberto!" : "Caixa fechado!");
  };

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
    { label: "Saldo", value: formatKz(openingBalance + summary.total) },
  ];

  const methodKeys = Object.keys(summary.byMethod);

  return (
    <div className="space-y-6">
      <PageHeader title="Caixa" subtitle="Lançamentos automáticos vindos da Agenda + manuais" actions={
        <div className="flex gap-2 flex-wrap">
          <ExportButton
            onExportCSV={() => exportToCSV({ title: "Relatório de Caixa - GenOmni Salon", subtitle: "Movimentações", columns: exportColumns, data: movements, summary: exportSummary, filename: "relatorio-caixa" })}
            onExportPDF={() => exportToPDF({ title: "Relatório de Caixa", subtitle: "Movimentações", columns: exportColumns, data: movements, summary: exportSummary, filename: "relatorio-caixa" })}
          />
          {isOpen && (
            <Button onClick={() => { setForm({ description: "", value: 0, type: "in", method: "Multicaixa Express" }); setDialogOpen(true); }} variant="outline" className="shadow-sm">
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
          { label: "Saldo Actual", value: openingBalance + summary.total, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
        ].map((item) => (
          <Card key={item.label} className="shadow-card overflow-hidden">
            <div className="h-1 gradient-primary" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{formatKz(item.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {methodKeys.length > 0 && (
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <CardTitle className="font-serif text-lg flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Fechamento por Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PAYMENT_METHODS.map(m => {
                const b = summary.byMethod[m] || { in: 0, out: 0 };
                const net = b.in - b.out;
                return (
                  <div key={m} className="rounded-xl border border-border/50 p-3 bg-secondary/30">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m}</p>
                    <p className="text-base font-bold text-foreground tabular-nums">{formatKz(net)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">+{formatKz(b.in)} / -{formatKz(b.out)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Movimentações ({todaySummary.items.length} hoje)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem movimentações ainda. Finalize um atendimento na Agenda para ver lançamentos automáticos.</p>
          ) : (
            <div className="space-y-2">
              {[...movements].reverse().map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${m.type === "in" ? "bg-emerald-50" : "bg-destructive/10"}`}>
                      {m.type === "in" ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.description}</p>
                      <p className="text-xs text-muted-foreground">{m.date} {m.time} • {m.method} • {m.source}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${m.type === "in" ? "text-emerald-600" : "text-destructive"}`}>
                    {m.type === "in" ? "+" : "-"}{formatKz(m.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Nova Movimentação Manual" onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as "in" | "out" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada</SelectItem>
                <SelectItem value="out">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Valor (Kz)</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
          <div className="col-span-2 space-y-2">
            <Label>Método</Label>
            <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v as PaymentMethod }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.filter(m => m !== "Fiado").map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudDialog>
    </div>
  );
};

export default Cashier;
