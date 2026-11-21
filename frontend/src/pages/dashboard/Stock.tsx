import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, AlertTriangle, Package, Bell, PackagePlus, History, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";
import { toast } from "sonner";

const emptyForm = { name: "", category: "", price: 0, stock: 0, min_stock: 0, active: true };

const Stock = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [restockTarget, setRestockTarget] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [adjustForm, setAdjustForm] = useState<{ qty: number; direction: "consume" | "restock"; reason: string }>({ qty: 0, direction: "consume", reason: "" });
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [prod, mov] = await Promise.all([api.products.list(), api.products.movements()]);
    setProducts(prod || []); setMovements(mov || []);
  };
  useEffect(() => { load().catch((error: any) => toast.error(error.message || "Erro ao carregar estoque")); }, []);
  const lowStock = products.filter((p) => Number(p.stock || 0) <= Number(p.min_stock || 0));

  useEffect(() => { if (lowStock.length > 0) toast.warning(`${lowStock.length} produto(s) com estoque baixo!`, { duration: 5000, icon: <Bell className="h-4 w-4" /> }); }, [lowStock.length]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: any) => { setEditingId(p.id); setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, min_stock: p.min_stock, active: p.active ?? true }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };
  const openRestock = (p: any) => { setRestockTarget(p); setRestockQty(0); setRestockOpen(true); };
  const openAdjust = (p: any) => { setAdjustTarget(p); setAdjustForm({ qty: 0, direction: "consume", reason: "" }); setAdjustOpen(true); };

  const handleSave = async () => { try { if (editingId) await api.products.update(editingId, form); else await api.products.create(form); setDialogOpen(false); await load(); toast.success(editingId ? "Produto atualizado!" : "Produto cadastrado!"); } catch (error: any) { toast.error(error.message || "Erro ao guardar produto"); } };
  const handleDelete = async () => { if (!editingId) return; await api.products.delete(editingId); setDeleteOpen(false); await load(); toast.success("Produto removido!"); };
  const registerMovement = async (target: any, qty: number, type: "consume" | "restock", reason: string) => { if (!target || qty <= 0) return; await api.products.createMovement({ product_id: target.id, qty, type, reason }); await load(); };
  const handleRestock = async () => { try { await registerMovement(restockTarget, restockQty, "restock", "Reposição de estoque"); setRestockOpen(false); toast.success(`+${restockQty} ${restockTarget?.name || "produto"} adicionado(s) ao estoque.`); } catch (error: any) { toast.error(error.message || "Erro ao repor estoque"); } };
  const handleAdjust = async () => { try { await registerMovement(adjustTarget, adjustForm.qty, adjustForm.direction, adjustForm.reason || "Ajuste manual"); setAdjustOpen(false); toast.success(`Ajuste registado em ${adjustTarget?.name || "produto"}.`); } catch (error: any) { toast.error(error.message || "Erro ao ajustar estoque"); } };

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" subtitle="Consumo automático ao finalizar atendimentos" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button>} />
      {lowStock.length > 0 && <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/30 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="font-semibold text-amber-800 text-sm">Estoque Baixo — {lowStock.length} produto(s)</p><p className="text-xs text-amber-700 mt-0.5">{lowStock.map((p) => p.name).join(", ")}</p></div></CardContent></Card>}
      <Card className="shadow-card overflow-hidden"><CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 py-4"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Package className="h-4 w-4 text-primary" /> {products.length} produtos</div></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-secondary/30"><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Preço</TableHead><TableHead className="text-right">Estoque</TableHead><TableHead>Status</TableHead><TableHead className="w-32 text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{products.map((p) => <TableRow key={p.id} className="group hover:bg-secondary/40 transition-colors"><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-muted-foreground">{p.category}</TableCell><TableCell className="text-right font-semibold">{formatKz(p.price)}</TableCell><TableCell className="text-right tabular-nums">{p.stock}</TableCell><TableCell>{Number(p.stock || 0) <= Number(p.min_stock || 0) ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Baixo</Badge> : <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">OK</Badge>}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openRestock(p)} title="Repor estoque"><PackagePlus className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAdjust(p)} title="Ajuste manual"><SlidersHorizontal className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      {movements.length > 0 && <Card className="shadow-card overflow-hidden"><CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50"><CardTitle className="font-serif text-lg flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Movimentações Recentes</CardTitle></CardHeader><CardContent className="pt-4"><div className="space-y-1.5">{movements.slice(0, 10).map(m => <div key={m.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/30"><div><span className="font-medium">{m.productName}</span><span className="text-xs text-muted-foreground ml-2">{m.reason} • {m.date}</span></div><Badge variant="outline" className={`text-[10px] ${m.type === "consume" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{m.type === "consume" ? `-${m.qty}` : `+${m.qty}`}</Badge></div>)}</div></CardContent></Card>}
      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Produto" : "Novo Produto"} onSave={handleSave}><div className="grid grid-cols-2 gap-4"><div className="col-span-2 space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div><div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div><div className="space-y-2"><Label>Preço (Kz)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div><div className="space-y-2"><Label>Estoque Inicial</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} /></div><div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))} /></div></div></CrudDialog>
      <CrudDialog open={restockOpen} onOpenChange={setRestockOpen} title={`Repor — ${restockTarget?.name || ""}`} onSave={handleRestock} saveLabel="Adicionar"><div className="space-y-3"><p className="text-sm text-muted-foreground">Estoque actual: <span className="font-semibold text-foreground">{restockTarget?.stock || 0}</span></p><div className="space-y-2"><Label>Quantidade a adicionar</Label><Input type="number" min={1} value={restockQty} onChange={e => setRestockQty(Math.max(0, Number(e.target.value)))} /></div></div></CrudDialog>
      <CrudDialog open={adjustOpen} onOpenChange={setAdjustOpen} title={`Ajuste manual — ${adjustTarget?.name || ""}`} onSave={handleAdjust} saveLabel="Registar"><div className="space-y-3"><p className="text-xs text-muted-foreground">Use para perdas, quebras, sobras ou correcções de inventário.</p><p className="text-sm">Stock actual: <span className="font-semibold">{adjustTarget?.stock || 0}</span></p><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Tipo</Label><Select value={adjustForm.direction} onValueChange={v => setAdjustForm(f => ({ ...f, direction: v as "consume" | "restock" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="consume">Saída (perda/quebra)</SelectItem><SelectItem value="restock">Entrada (sobra/correcção)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Quantidade</Label><Input type="number" min={1} value={adjustForm.qty} onChange={e => setAdjustForm(f => ({ ...f, qty: Math.max(0, Number(e.target.value)) }))} /></div></div><div className="space-y-2"><Label>Motivo</Label><Input value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} /></div></div></CrudDialog>
      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Produto" description="Tem certeza?" onSave={handleDelete} saveLabel="Excluir" variant="destructive"><p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p></CrudDialog>
    </div>
  );
};
export default Stock;
