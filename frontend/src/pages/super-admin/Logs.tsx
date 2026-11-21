import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Logs = () => {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { api.superAdmin.logs().then(setLogs).catch((error: any) => toast.error(error.message || "Erro ao carregar logs")); }, []);
  const filtered = useMemo(() => logs.filter(l => [l.tenant, l.user, l.action, l.ip].some(v => String(v || "").toLowerCase().includes(search.toLowerCase()))), [logs, search]);
  return <div className="space-y-6"><PageHeader title="Logs da Plataforma" subtitle="Auditoria global de todas as ações realizadas no sistema" /><Card className="shadow-card"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Procurar por empresa, utilizador ou ação..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></CardContent></Card><Card className="shadow-card"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Data / Hora</TableHead><TableHead>Empresa</TableHead><TableHead>Utilizador</TableHead><TableHead>Ação</TableHead><TableHead>IP</TableHead></TableRow></TableHeader><TableBody>{filtered.map(l => <TableRow key={l.id}><TableCell className="font-mono text-xs text-muted-foreground">{l.id}</TableCell><TableCell className="text-xs">{l.timestamp}</TableCell><TableCell className="font-medium">{l.tenant}</TableCell><TableCell>{l.user}</TableCell><TableCell className="text-sm text-muted-foreground">{l.action}</TableCell><TableCell className="font-mono text-xs">{l.ip}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></div>;
};
export default Logs;
