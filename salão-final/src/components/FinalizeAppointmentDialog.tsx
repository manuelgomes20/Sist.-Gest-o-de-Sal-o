import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHODS, PaymentMethod, salesEngine, ServiceBOMItem } from "@/lib/salesEngine";
import { formatKz, mockProducts, mockServices } from "@/data/mockData";
import { CheckCircle2, AlertTriangle, Plus, X } from "lucide-react";
import { toast } from "sonner";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    client: string;
    service: string;
    employee: string;
    price: number;
  } | null;
  onFinalized?: () => void;
}

const FinalizeAppointmentDialog = ({ open, onOpenChange, appointment, onFinalized }: Props) => {
  const [method, setMethod] = useState<PaymentMethod>("Multicaixa Express");
  const [discount, setDiscount] = useState(0);
  const [tip, setTip] = useState(0);
  const [paid, setPaid] = useState(0);
  const [consumed, setConsumed] = useState<ServiceBOMItem[]>([]);

  const service = mockServices.find(s => s.name === appointment?.service);
  const total = useMemo(
    () => Math.max(0, (appointment?.price || 0) - discount) + tip,
    [appointment, discount, tip],
  );

  useEffect(() => {
    if (open && appointment) {
      setMethod("Multicaixa Express");
      setDiscount(0);
      setTip(0);
      setPaid(appointment.price);
      const base = salesEngine.getState().bom[service?.id || ""] || [];
      // clone so edits don't mutate the saved BOM
      setConsumed(base.map(b => ({ ...b })));
    }
  }, [open, appointment, service?.id]);

  useEffect(() => {
    if (method === "Fiado") setPaid(0);
    else setPaid(total);
  }, [method, total]);


  if (!appointment) return null;

  const remaining = Math.max(0, total - paid);
  const commission = service ? Math.round((appointment.price * service.commission) / 100) : 0;

  const handleConfirm = () => {
    const res = salesEngine.finalizeAppointment({
      appointmentId: appointment.id,
      client: appointment.client,
      serviceId: service?.id,
      serviceName: appointment.service,
      employee: appointment.employee,
      price: appointment.price,
      discount,
      tip,
      paid,
      method,
      consumed,
    });

    if (res.duplicated) {
      toast.error("Este atendimento já foi finalizado.");
      onOpenChange(false);
      return;
    }
    toast.success(
      remaining > 0
        ? `Atendimento finalizado. ${formatKz(remaining)} adicionado a "A Receber".`
        : "Atendimento finalizado e lançado no caixa!",
    );
    onOpenChange(false);
    onFinalized?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="font-serif flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Finalizar Atendimento
          </DialogTitle>
          <DialogDescription>
            {appointment.client} • {appointment.service} • {appointment.employee}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Preço base</Label>
              <div className="h-10 px-3 rounded-md border bg-secondary/40 flex items-center font-semibold">{formatKz(appointment.price)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Comissão prevista</Label>
              <div className="h-10 px-3 rounded-md border bg-secondary/40 flex items-center text-primary font-semibold">{formatKz(commission)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desconto (Kz)</Label>
              <Input type="number" value={discount} min={0} onChange={e => setDiscount(Math.max(0, Number(e.target.value)))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gorjeta (Kz)</Label>
              <Input type="number" value={tip} min={0} onChange={e => setTip(Math.max(0, Number(e.target.value)))} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Método de pagamento</Label>
            <Select value={method} onValueChange={v => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Valor pago agora (Kz)</Label>
            <Input
              type="number"
              value={paid}
              min={0}
              max={total}
              onChange={e => setPaid(Math.max(0, Math.min(total, Number(e.target.value))))}
              disabled={method === "Fiado"}
            />
            <p className="text-[11px] text-muted-foreground">
              Pagamento parcial gera automaticamente uma conta em "A Receber".
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatKz(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pago agora</span>
              <span className="font-semibold text-emerald-600">{formatKz(paid)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">A receber</span>
              <span className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-foreground"}`}>{formatKz(remaining)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Consumo real de estoque</p>
              <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setConsumed(c => [...c, { productId: mockProducts[0].id, qty: 1 }])}>
                <Plus className="h-3 w-3 mr-1" /> Produto
              </Button>
            </div>
            {consumed.length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum produto será descontado.</p>}
            {consumed.map((b, idx) => {
              const p = mockProducts.find(x => x.id === b.productId);
              const cur = salesEngine.getProductStock(b.productId);
              const low = cur - b.qty < 0;
              return (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Produto</Label>
                    <Select value={b.productId} onValueChange={v => setConsumed(c => c.map((x, i) => i === idx ? { ...x, productId: v } : x))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{mockProducts.map(mp => <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Qtd real</Label>
                    <Input type="number" min={0} step="0.5" className="h-9" value={b.qty}
                      onChange={e => setConsumed(c => c.map((x, i) => i === idx ? { ...x, qty: Math.max(0, Number(e.target.value)) } : x))} />
                  </div>
                  <div className="w-24 text-right pb-2">
                    <span className={low ? "text-destructive text-[11px] flex items-center justify-end gap-1" : "text-[11px] text-muted-foreground"}>
                      {low && <AlertTriangle className="h-3 w-3" />} stock {cur}
                    </span>
                    {p && <p className="text-[10px] text-muted-foreground truncate">prev: {(salesEngine.getState().bom[service?.id || ""] || []).find(x => x.productId === b.productId)?.qty ?? 0}×</p>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => setConsumed(c => c.filter((_, i) => i !== idx))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            <p className="text-[11px] text-muted-foreground">Ajuste se o consumo real foi diferente da ficha técnica. Estoque será descontado por estes valores.</p>
          </div>

        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} className="gradient-primary text-primary-foreground">
            Confirmar e Lançar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizeAppointmentDialog;
