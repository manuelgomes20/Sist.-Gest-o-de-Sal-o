import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";

const logs = [
  { id: "1", user: "Sofia Tavares", action: "Criou agendamento", target: "Ana Silva - Corte Feminino", timestamp: "2026-04-04 09:15:22", type: "create", area: "Agenda" },
  { id: "2", user: "Teresa Nunes", action: "Confirmou agendamento", target: "Carla Santos - Manicure", timestamp: "2026-04-04 09:20:10", type: "update", area: "Agenda" },
  { id: "3", user: "Patrícia Mendes", action: "Concluiu atendimento", target: "Fernanda Lima - Corte Masculino", timestamp: "2026-04-04 14:35:00", type: "update", area: "Serviços" },
  { id: "4", user: "Teresa Nunes", action: "Registrou entrada no caixa", target: "Kz 5.000 - Multicaixa Express", timestamp: "2026-04-04 09:45:30", type: "create", area: "Caixa" },
  { id: "5", user: "Sofia Tavares", action: "Actualizou preço do serviço", target: "Coloração: Kz 10.000 → Kz 12.000", timestamp: "2026-04-03 16:00:00", type: "update", area: "Serviços" },
  { id: "6", user: "Teresa Nunes", action: "Cadastrou novo cliente", target: "Juliana Costa", timestamp: "2026-04-03 10:30:00", type: "create", area: "Clientes" },
  { id: "7", user: "Sofia Tavares", action: "Actualizou dados da empresa", target: "Endereço alterado", timestamp: "2026-04-02 11:00:00", type: "update", area: "Configurações" },
  { id: "8", user: "Sofia Tavares", action: "Adicionou produto ao estoque", target: "Shampoo Profissional 1L - 10 unidades", timestamp: "2026-04-02 15:20:00", type: "create", area: "Estoque" },
  { id: "9", user: "Teresa Nunes", action: "Registrou saída no caixa", target: "Kz 8.000 - Compra de material", timestamp: "2026-04-01 14:00:00", type: "create", area: "Caixa" },
  { id: "10", user: "Sofia Tavares", action: "Removeu funcionário", target: "João Pedro - Barbeiro", timestamp: "2026-04-01 09:00:00", type: "delete", area: "Funcionários" },
];

const typeConfig: Record<string, { label: string; className: string }> = {
  create: { label: "Criação", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "Actualização", className: "bg-blue-50 text-blue-700 border-blue-200" },
  delete: { label: "Exclusão", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const areas = ["Todas", "Agenda", "Clientes", "Funcionários", "Serviços", "Estoque", "Caixa", "Configurações"];

const Audit = () => {
  const [selectedArea, setSelectedArea] = useState("Todas");

  const filtered = selectedArea === "Todas" ? logs : logs.filter(l => l.area === selectedArea);

  const areaStats = areas.filter(a => a !== "Todas").map(area => ({
    area,
    count: logs.filter(l => l.area === area).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" subtitle="Log de todas as acções no sistema" />

      {/* Area Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {areaStats.map(({ area, count }) => (
          <Card
            key={area}
            className={`shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedArea === area ? "border-primary ring-1 ring-primary/20" : ""}`}
            onClick={() => setSelectedArea(selectedArea === area ? "Todas" : area)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="text-[11px] text-muted-foreground">{area}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Actividade Recente
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors border border-border/30">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{log.user}</span>
                    <span className="text-sm text-muted-foreground">{log.action}</span>
                    <Badge variant="outline" className={`text-[10px] px-2 ${typeConfig[log.type]?.className}`}>
                      {typeConfig[log.type]?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-2">{log.area}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.target}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">{log.timestamp}</p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum registo encontrado para esta área.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
