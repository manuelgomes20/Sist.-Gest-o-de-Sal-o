import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, History, FileText, Eye, ShieldCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import {
  LegalDocType, LegalDocVersion, LEGAL_LABELS, loadAllDocs, upsertDoc,
  deleteDoc, setActiveVersion, newVersionFrom, loadAcceptances,
} from "@/lib/legalDocs";

const TYPES: LegalDocType[] = ["terms", "privacy", "contract", "cookies"];

const LegalDocsAdmin = () => {
  const [all, setAll] = useState<LegalDocVersion[]>([]);
  const [type, setType] = useState<LegalDocType>("terms");
  const [editing, setEditing] = useState<LegalDocVersion | null>(null);
  const [previewDoc, setPreviewDoc] = useState<LegalDocVersion | null>(null);

  const reload = () => setAll(loadAllDocs());
  useEffect(() => { reload(); }, []);

  const docsForType = useMemo(
    () => all.filter(d => d.type === type).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)),
    [all, type]
  );

  const acceptances = useMemo(() => loadAcceptances(), [all]);

  const handleNew = () => {
    const base = docsForType[0];
    const draft: LegalDocVersion = base
      ? newVersionFrom(base, bumpVersion(base.version))
      : {
          id: crypto.randomUUID(),
          type,
          version: "1.0.0",
          title: LEGAL_LABELS[type],
          content: `<h2>${LEGAL_LABELS[type]}</h2><p>Escreva aqui o conteúdo...</p>`,
          active: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: "Super Admin",
        };
    setEditing(draft);
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    upsertDoc(editing);
    reload();
    setEditing(null);
    toast.success("Versão guardada");
  };

  const handleDelete = (id: string) => {
    deleteDoc(id);
    reload();
    toast.success("Versão eliminada");
  };

  const handleActivate = (id: string) => {
    setActiveVersion(type, id);
    reload();
    toast.success("Versão ativada e publicada");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Termos & Políticas"
        subtitle="Faça a gestão dos documentos legais publicados na plataforma"
      />

      <Tabs value={type} onValueChange={(v) => setType(v as LegalDocType)}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          {TYPES.map(t => (
            <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">
              {LEGAL_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        {TYPES.map(t => (
          <TabsContent key={t} value={t} className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> {LEGAL_LABELS[t]}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {docsForType.length} versão(ões) registada(s)
                  </p>
                </div>
                <Button onClick={handleNew} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Nova versão
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {docsForType.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sem versões. Crie a primeira versão deste documento.
                  </p>
                )}
                {docsForType.map(d => (
                  <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{d.title}</span>
                        <Badge variant="outline" className="text-[10px]">v{d.version}</Badge>
                        {d.active && (
                          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                            Publicada
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Atualizado em {new Date(d.updatedAt).toLocaleString("pt-PT")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(d)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(d)}>
                        Editar
                      </Button>
                      {!d.active && (
                        <Button size="sm" variant="default" onClick={() => handleActivate(d.id)}>
                          Ativar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Acceptance audit */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Auditoria de Aceites
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Registo automático: data, IP, dispositivo, utilizador e versões aceites.
          </p>
        </CardHeader>
        <CardContent>
          {acceptances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Ainda não existem aceitações registadas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Empresa / Utilizador</th>
                    <th className="py-2 pr-3">IP</th>
                    <th className="py-2 pr-3">Dispositivo</th>
                    <th className="py-2 pr-3">Versões</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptances.slice(0, 50).map(a => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(a.acceptedAt).toLocaleString("pt-PT")}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="font-medium">{a.tenantName}</div>
                        <div className="text-muted-foreground">{a.userName} • {a.userEmail}</div>
                      </td>
                      <td className="py-2 pr-3 font-mono">{a.ip}</td>
                      <td className="py-2 pr-3">{a.device}</td>
                      <td className="py-2 pr-3">
                        {a.versions.map(v => (
                          <Badge key={v.id} variant="outline" className="mr-1 mb-1 text-[10px]">
                            {LEGAL_LABELS[v.type]} v{v.version}
                          </Badge>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              {editing?.id && all.some(d => d.id === editing.id) ? "Editar versão" : "Nova versão"}
            </DialogTitle>
            <DialogDescription>
              Edite o conteúdo. Suporta HTML básico (h2, p, ul, strong, a).
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Título</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Versão</Label>
                  <Input value={editing.version} onChange={(e) => setEditing({ ...editing, version: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Conteúdo (HTML)</Label>
                <Textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={14}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Publicar imediatamente</p>
                  <p className="text-xs text-muted-foreground">Esta versão substituirá a publicada atualmente.</p>
                </div>
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Guardar versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{previewDoc?.title} <Badge variant="outline" className="ml-2 text-[10px]">v{previewDoc?.version}</Badge></DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewDoc.content }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const bumpVersion = (v: string) => {
  const parts = v.split(".").map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[parts.length - 1] += 1;
  return parts.join(".");
};

export default LegalDocsAdmin;
