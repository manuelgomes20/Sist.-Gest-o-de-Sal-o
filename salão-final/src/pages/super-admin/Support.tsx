import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Send, User, Building2, Calendar, Tag } from "lucide-react";
import { mockSupportTickets, type SupportStatus, type SupportPriority } from "@/data/superAdminData";
import StatCard from "@/components/StatCard";
import { LifeBuoy, Clock, AlertTriangle } from "lucide-react";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";

interface TicketReply {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  isAgent: boolean;
}

interface Ticket {
  id: string;
  tenant: string;
  subject: string;
  priority: SupportPriority;
  status: SupportStatus;
  openedAt: string;
  agent: string;
  replies?: TicketReply[];
}

const priorityVariant: Record<string, string> = {
  low: "bg-muted text-foreground",
  medium: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};
const statusVariant: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};
const statusLabel: Record<string, string> = { open: "Aberto", in_progress: "Em andamento", resolved: "Resolvido" };

const Support = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tickets, setTickets] = useState<Ticket[]>(
    mockSupportTickets.map(t => ({ ...t, replies: [] as TicketReply[] }))
  );
  const [replyOpen, setReplyOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState<SupportStatus>("in_progress");
  const [replyAgent, setReplyAgent] = useState("Suporte L2");

  const openReply = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setReplyMessage("");
    setReplyStatus(ticket.status === "open" ? "in_progress" : ticket.status);
    setReplyAgent(ticket.agent === "—" ? "Suporte L2" : ticket.agent);
    setReplyOpen(true);
  };

  const handleSendReply = () => {
    if (!activeTicket) return;
    if (!replyMessage.trim()) {
      toast.error("Escreva uma mensagem antes de enviar");
      return;
    }
    const newReply: TicketReply = {
      id: `R-${Date.now()}`,
      author: replyAgent,
      message: replyMessage.trim(),
      timestamp: new Date().toLocaleString("pt-PT"),
      isAgent: true,
    };
    setTickets(prev => prev.map(t =>
      t.id === activeTicket.id
        ? { ...t, status: replyStatus, agent: replyAgent, replies: [...(t.replies || []), newReply] }
        : t
    ));
    toast.success(`Resposta enviada ao ticket ${activeTicket.id}`);
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.tenant.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    critical: tickets.filter(t => t.priority === "critical").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Suporte Técnico" subtitle="Gerencie tickets e pedidos de assistência das empresas" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Tickets" value={String(stats.total)} icon={LifeBuoy} />
        <StatCard title="Abertos" value={String(stats.open)} icon={Clock} />
        <StatCard title="Em Andamento" value={String(stats.inProgress)} icon={MessageSquare} />
        <StatCard title="Críticos" value={String(stats.critical)} icon={AlertTriangle} />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Procurar tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Aberto em</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="font-medium">{t.tenant}</TableCell>
                    <TableCell className="max-w-xs truncate">{t.subject}</TableCell>
                    <TableCell><Badge variant="outline" className={priorityVariant[t.priority]}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={statusVariant[t.status]}>{statusLabel[t.status]}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.openedAt}</TableCell>
                    <TableCell className="text-xs">{t.agent}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openReply(t)}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Responder
                        {t.replies && t.replies.length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{t.replies.length}</Badge>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CrudDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        title={activeTicket ? `Responder ao ticket ${activeTicket.id}` : "Responder"}
        description="Envie uma resposta ao cliente e atualize o estado do ticket."
        onSave={handleSendReply}
        saveLabel="Enviar resposta"
      >
        {activeTicket && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{activeTicket.tenant}</span>
                <Badge variant="outline" className={priorityVariant[activeTicket.priority]}>{activeTicket.priority}</Badge>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span className="text-foreground">{activeTicket.subject}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{activeTicket.openedAt}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{activeTicket.agent}</span>
              </div>
            </div>

            {activeTicket.replies && activeTicket.replies.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <Label className="text-xs text-muted-foreground">Histórico de respostas</Label>
                {activeTicket.replies.map(r => (
                  <div key={r.id} className="rounded-md border bg-background p-2.5 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs text-primary">{r.author}</span>
                      <span className="text-[10px] text-muted-foreground">{r.timestamp}</span>
                    </div>
                    <p className="text-xs text-foreground/90">{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="agent">Agente responsável</Label>
                <Select value={replyAgent} onValueChange={setReplyAgent}>
                  <SelectTrigger id="agent"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Suporte L1">Suporte L1</SelectItem>
                    <SelectItem value="Suporte L2">Suporte L2</SelectItem>
                    <SelectItem value="Suporte L3">Suporte L3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Atualizar estado</Label>
                <Select value={replyStatus} onValueChange={(v) => setReplyStatus(v as SupportStatus)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Mensagem ao cliente</Label>
              <Textarea
                id="message"
                placeholder="Escreva a resposta detalhada para o cliente..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Send className="h-3 w-3" />
                A resposta será enviada por e-mail ao responsável da empresa.
              </p>
            </div>
          </div>
        )}
      </CrudDialog>
    </div>
  );
};

export default Support;
