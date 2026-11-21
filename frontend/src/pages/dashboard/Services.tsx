import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Clock, DollarSign, Package, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";
import { toast } from "sonner";

type BomItem = { product_id?: string; productId?: string; qty: number };
const emptyForm = { name: "", price: 0, duration: 0, commission: 0, category: "" };
const getProductId = (item: BomItem) => item.product_id || item.productId || "";

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bomMap, setBomMap] = useState<Record<string, BomItem[]>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bomOpen, setBomOpen] = useState(false);
  const [bomServiceId, setBomServiceId] = useState<string | null>(null);
  const [bomDraft, setBomDraft] = useState<BomItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [svc, prod, bom] = await Promise.all([api.services.list(), api.products.list(), api.products.bom()]);
    setServices(svc || []); setProducts(prod || []); setBomMap(bom || {});
  };
  useEffect(() => { load().catch((error: any) => toast.error(error.message || "Erro ao carregar serviços")); }, []);
  const categories = useMemo(() => [...new Set(services.map((s) => s.category || "Outros"))], [services]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({ name: s.name, price: s.price, duration: s.duration, commission: s.commission, category: s.category }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };
  const openBom = (id: string) => { setBomServiceId(id); setBomDraft(bomMap[id] || []); setBomOpen(true); };

  const handleSave = async () => { try { if (editingId) await api.services.update(editingId, { ...form, active: true }); else await api.services.create({ ...form, active: true }); setDialogOpen(false); await load(); toast.success(editingId ? "Serviço atualizado!" : "Serviço cadastrado!"); } catch (error: any) { toast.error(error.message || "Erro ao guardar serviço"); } };
  const handleDelete = async () => { if (!editingId) return; await api.services.delete(editingId); setDeleteOpen(false); await load(); toast.success("Serviço removido!"); };
  const handleBomSave = async () => { if (!bomServiceId) return; await api.products.updateBom(bomServiceId, bomDraft.map(it => ({ product_id: getProductId(it), qty: Number(it.qty || 1) }))); setBomOpen(false); await load(); toast.success("Ficha técnica atualizada!"); };
  const updateBomItem = (idx: number, patch: Partial<BomItem>) => setBomDraft(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const addBomItem = () => products[0] && setBomDraft(prev => [...prev, { product_id: products[0].id, qty: 1 }]);
  const removeBomItem = (idx: number) => setBomDraft(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <PageHeader title="Serviços" subtitle="Catálogo + ficha técnica (produtos consumidos)" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Serviço</Button>} />
      {categories.map((cat) => <div key={cat} className="space-y-3"><div className="flex items-center gap-2"><div className="h-1 w-6 rounded-full gradient-primary" /><h2 className="text-lg font-serif font-semibold text-foreground">{cat}</h2><Badge variant="secondary" className="text-[10px]">{services.filter(s => (s.category || "Outros") === cat).length}</Badge></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{services.filter((s) => (s.category || "Outros") === cat).map((s) => { const bomCount = (bomMap[s.id] || []).length; return <Card key={s.id} className="group shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"><CardContent className="p-0"><div className="h-1 gradient-primary" /><div className="p-5"><div className="flex items-start justify-between mb-3"><h3 className="font-semibold text-foreground">{s.name}</h3><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openBom(s.id)} title="Ficha técnica"><Package className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></div><div className="space-y-2"><div className="flex items-center gap-2 text-sm"><DollarSign className="h-3.5 w-3.5 text-primary" /><span className="font-bold text-foreground text-lg">{formatKz(s.price)}</span></div><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration} min</span><span>Comissão: {s.commission}%</span><span className="flex items-center gap-1"><Package className="h-3 w-3" /> {bomCount} produto(s)</span></div></div></div></CardContent></Card>; })}</div></div>)}
      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Serviço" : "Novo Serviço"} onSave={handleSave}><div className="grid grid-cols-2 gap-4"><div className="col-span-2 space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div><div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div><div className="space-y-2"><Label>Preço (Kz)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div><div className="space-y-2"><Label>Duração (min)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div><div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} /></div></div></CrudDialog>
      <CrudDialog open={bomOpen} onOpenChange={setBomOpen} title={`Ficha técnica — ${services.find(s => s.id === bomServiceId)?.name || ""}`} onSave={handleBomSave}><div className="space-y-3"><p className="text-xs text-muted-foreground">Defina quais produtos são consumidos automaticamente do estoque a cada execução deste serviço.</p><div className="space-y-2">{bomDraft.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum produto vinculado.</p>}{bomDraft.map((it, idx) => <div key={idx} className="flex items-end gap-2"><div className="flex-1 space-y-1"><Label className="text-xs">Produto</Label><Select value={getProductId(it)} onValueChange={v => updateBomItem(idx, { product_id: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div><div className="w-24 space-y-1"><Label className="text-xs">Qtd</Label><Input type="number" min={1} value={it.qty} onChange={e => updateBomItem(idx, { qty: Math.max(1, Number(e.target.value)) })} /></div><Button variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0" onClick={() => removeBomItem(idx)}><X className="h-4 w-4" /></Button></div>)}</div><Button variant="outline" size="sm" onClick={addBomItem} className="w-full"><Plus className="h-4 w-4 mr-1" /> Adicionar produto</Button></div></CrudDialog>
      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Serviço" description="Tem certeza?" onSave={handleDelete} saveLabel="Excluir" variant="destructive"><p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p></CrudDialog>
    </div>
  );
};
export default Services;
