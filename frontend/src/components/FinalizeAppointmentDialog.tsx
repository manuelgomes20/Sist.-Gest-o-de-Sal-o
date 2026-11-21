import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS = ["Dinheiro", "TPA", "Transferência", "Multicaixa Express", "Fiado", "Outro"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: { id: string; client: string; service: string; employee: string; price: number } | null;
  onFinalized?: (updated?: any) => void;
}

const FinalizeAppointmentDialog = ({ open, onOpenChange, appointment, onFinalized }: Props) => {
  const [method, setMethod] = useState("Multicaixa Express");
  const [paid, setPaid] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const total = useMemo(() => appointment?.price || 0, [appointment]);

  useEffect(() => {
    if (open && appointment) { setMethod("Multicaixa Express"); setPaid(appointment.price); setDueDate(""); }
  }, [open, appointment]);
  useEffect(() => { setPaid(method === "Fiado" ? 0 : total); }, [method, total]);

  if (!appointment) return null;
  const remaining = Math.max(0, total - paid);

  const handleConfirm = async () => {
    try {
      const updated = await api.appointments.finalize(appointment.id, { payment_method: method, paid_value: paid, due_date: dueDate });
      toast.success(remaining > 0 ? `Atendimento finalizado. ${formatKz(remaining)} adicionado a A Receber.` : "Atendimento finalizado e lançado no caixa!");
      onOpenChange(false);
      onFinalized?.(updated);
    } catch (error: any) {
      toast.error(error.message || "Erro ao finalizar atendimento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="font-serif flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Finalizar Atendimento</DialogTitle>
          <DialogDescription>{appointment.client} • {appointment.service} • {appointment.employee}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-1"><Label className="text-xs">Preço base</Label><div className="h-10 px-3 rounded-md border bg-secondary/40 flex items-center font-semibold">{formatKz(appointment.price)}</div></div>
          <div className="space-y-1"><Label className="text-xs">Método de pagamento</Label><Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Valor pago agora (Kz)</Label><Input type="number" value={paid} min={0} max={total} onChange={e => setPaid(Math.max(0, Math.min(total, Number(e.target.value))))} disabled={method === "Fiado"} /><p className="text-[11px] text-muted-foreground">Pagamento parcial ou fiado gera automaticamente uma conta em A Receber.</p></div>
          {remaining > 0 && <div className="space-y-1"><Label className="text-xs">Data prevista de pagamento</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>}
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-semibold">{formatKz(total)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Pago agora</span><span className="font-semibold text-emerald-600">{formatKz(paid)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">A receber</span><span className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-foreground"}`}>{formatKz(remaining)}</span></div></div>
          <div className="rounded-xl border border-border/60 p-4 text-xs text-muted-foreground">O backend lançará caixa, comissão, conta a receber e consumo de estoque com base na ficha técnica real do serviço.</div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0 bg-background"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={handleConfirm} className="gradient-primary text-primary-foreground">Confirmar e Lançar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default FinalizeAppointmentDialog;
