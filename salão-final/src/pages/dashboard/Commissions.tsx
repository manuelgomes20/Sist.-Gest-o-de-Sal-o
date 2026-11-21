import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockEmployees, mockAppointments, formatKz } from "@/data/mockData";
import { DollarSign } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ExportButton from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";
import { useSalesEngine } from "@/lib/salesEngine";

const Commissions = () => {
  const engineCommissions = useSalesEngine(s => s.commissions);

  const commissionData = mockEmployees.filter(e => e.type === "servico").map((emp) => {
    // 1) live commissions from finalized appointments
    const live = engineCommissions.filter(c => c.employee === emp.name && c.status !== "reversed");
    // 2) legacy mock fallback (completed appointments not yet finalized through the engine)
    const legacy = mockAppointments.filter(a => a.employee === emp.name && a.status === "completed");
    const liveRevenue = live.reduce((s, c) => s + c.price, 0);
    const liveCommission = live.reduce((s, c) => s + c.value, 0);
    const legacyRevenue = legacy.reduce((s, a) => s + a.price, 0);
    const legacyCommission = legacyRevenue * (emp.commission / 100);
    const totalRevenue = liveRevenue + legacyRevenue;
    const commissionValue = liveCommission + legacyCommission;
    return { ...emp, totalRevenue, commissionValue, appointments: live.length + legacy.length };
  });

  const totalCommissions = commissionData.reduce((s, e) => s + e.commissionValue, 0);

  const exportColumns = [
    { header: "Funcionário", key: "name" },
    { header: "Função", key: "role" },
    { header: "Atendimentos", key: "appointments", format: "number" as const },
    { header: "Receita", key: "totalRevenue", format: "currency" as const },
    { header: "% Comissão", key: "commission", format: "percent" as const },
    { header: "Valor Comissão", key: "commissionValue", format: "currency" as const },
  ];

  const exportSummary = [
    { label: "Total Comissões", value: formatKz(totalCommissions) },
    { label: "Funcionários", value: String(commissionData.length) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Comissões" subtitle="Cálculo automático por funcionário" actions={
        <ExportButton
          onExportCSV={() => exportToCSV({ title: "Relatório de Comissões - GenOmni Salon", subtitle: "Detalhamento por funcionário", columns: exportColumns, data: commissionData, summary: exportSummary, filename: "relatorio-comissoes" })}
          onExportPDF={() => exportToPDF({ title: "Relatório de Comissões", subtitle: "Detalhamento por funcionário", columns: exportColumns, data: commissionData, summary: exportSummary, filename: "relatorio-comissoes" })}
        />
      } />

      <Card className="shadow-card overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-sm">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total de Comissões</p>
            <p className="text-2xl font-bold text-foreground">{formatKz(totalCommissions)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Detalhamento por Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead>Funcionário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">% Comissão</TableHead>
                <TableHead className="text-right">Valor Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionData.map((e) => (
                <TableRow key={e.id} className="hover:bg-secondary/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                        {e.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.role}</TableCell>
                  <TableCell className="text-right">{e.appointments}</TableCell>
                  <TableCell className="text-right">{formatKz(e.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{e.commission}%</TableCell>
                  <TableCell className="text-right font-bold text-primary">{formatKz(e.commissionValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Commissions;
