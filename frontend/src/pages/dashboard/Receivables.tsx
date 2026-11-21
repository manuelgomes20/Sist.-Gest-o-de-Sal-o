import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { formatKz } from "@/lib/format";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PAYMENT_METHODS = ["Dinheiro", "TPA", "Transferência", "Multicaixa Express", "Outro"];
type Receivable = { id: string; client: string; description: string; total: number; paid: number; status: "open" | "partial" | "paid" | "reversed"; dueDate?: string | null };

const statusBadge = (s: Receivable["status"]) => {
  const map: Record<Receivable["status"], string> = {
    open: "bg-amber-50 text-amber-700 border-amber-200",
    partial: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    reversed: "bg-muted text-muted-foreground",
  };
  const label: Record<Receivable["status"], string> = { open: "Em aberto", partial: "Parcial", paid: "Pago", reversed: "Estornado" };
  return <Badge variant="outline" className={`text-[10px] ${map[s] || map.open}`}>{label[s] || s}</Badge>;
};

const Receivables = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [tab, setTab] = useState<"open" | "all">("open");
  const [payOpen, setPayOpen] = useState(false);
  const [target, setTarget] = useState<Receivable | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Multicaixa Express");

  const load = async () => setReceivables(await api.receivables.list());
  useEffect(() => { load().catch((error: any) => toast.error(error.message || "Erro ao carregar contas a receber")); }, []);

  const filtered = useMemo(() => tab === "open" ? receivables.filter(r => r.status === "open" || r.status === "partial") : receivables, [receivables, tab]);
  const totalOpen = receivables.filter(r => r.status === "open" || r.status === "partial").reduce((a, r) => a + (r.total - r.paid), 0);
  const totalReceived = receivables.reduce((a, r) => a + r.paid, 0);

  const openPay = (r: Receivable) => {
    setTarget(r);
    setPayAmount(r.total - r.paid);
    setPayMethod("Multicaixa Express");
    setPayOpen(true);
  };

  const handlePay = async () => {
    if (!target) return;
    try {
      await api.receivables.pay(target.id, { value: payAmount, method: payMethod });
      setPayOpen(false);
      await load();
      toast.success("Recebimento registrado no caixa!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar recebimento");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="A Receber" subtitle="Pendências e pagamentos parciais (fiado)" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Em aberto", value: totalOpen, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Já recebido", value: totalReceived, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total registado", value: receivables.reduce((a, r) => a + r.total, 0), icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
        ].map(item => (
          <Card key={item.label} className="shadow-card overflow-hidden"><div className="h-1 gradient-primary" /><CardContent className="p-5 flex items-center gap-4"><div className={`h-11 w-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}><item.icon className={`h-5 w-5 ${item.color}`} /></div><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p><p className={`text-xl font-bold ${item.color}`}>{formatKz(item.value)}</p></div></CardContent></Card>
        ))}
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 flex flex-row items-center justify-between gap-3"><CardTitle className="font-serif text-lg flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Contas a Receber</CardTitle><Tabs value={tab} onValueChange={v => setTab(v as "open" | "all")}><TabsList className="h-9"><TabsTrigger value="open">Em aberto</TabsTrigger><TabsTrigger value="all">Todas</TabsTrigger></TabsList></Tabs></CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma pendência.</div> : (
            <Table><TableHeader><TableRow className="bg-secondary/30"><TableHead>Cliente</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Pago</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Status</TableHead><TableHead className="w-20" /></TableRow></TableHeader><TableBody>{filtered.map(r => (
              <TableRow key={r.id} className="hover:bg-secondary/40"><TableCell className="font-medium">{r.client}</TableCell><TableCell className="text-muted-foreground">{r.description}</TableCell><TableCell className="text-right">{formatKz(r.total)}</TableCell><TableCell className="text-right text-emerald-600">{formatKz(r.paid)}</TableCell><TableCell className="text-right font-semibold">{formatKz(r.total - r.paid)}</TableCell><TableCell>{statusBadge(r.status)}</TableCell><TableCell className="text-right">{(r.status === "open" || r.status === "partial") && <Button size="sm" onClick={() => openPay(r)} className="gradient-primary text-primary-foreground h-8">Receber</Button>}</TableCell></TableRow>
            ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>

      <CrudDialog open={payOpen} onOpenChange={setPayOpen} title="Registar Recebimento" onSave={handlePay} saveLabel="Receber">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{target?.client} — saldo {target ? formatKz(target.total - target.paid) : ""}</p>
          <div className="space-y-2"><Label>Valor (Kz)</Label><Input type="number" value={payAmount} onChange={e => setPayAmount(Math.max(0, Number(e.target.value)))} /></div>
          <div className="space-y-2"><Label>Método</Label><Select value={payMethod} onValueChange={setPayMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </CrudDialog>
    </div>
  );
};

export default Receivables;
