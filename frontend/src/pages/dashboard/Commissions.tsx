import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ExportButton from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";
import { toast } from "sonner";

const Commissions = () => {
  const [items, setItems] = useState<any[]>([]);
  const [totalCommissions, setTotalCommissions] = useState(0);

  useEffect(() => {
    api.financial.commissions()
      .then(data => {
        setItems(data.items || []);
        setTotalCommissions(Number(data.total_commissions || 0));
      })
      .catch((error: any) => toast.error(error.message || "Erro ao carregar comissões"));
  }, []);

  const exportRows = items.map(e => ({
    name: e.name,
    role: e.role,
    appointments: e.appointments,
    totalRevenue: e.total_revenue,
    commission: e.commission_rate,
    commissionValue: e.commission_value,
  }));

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
    { label: "Funcionários", value: String(items.length) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Comissões" subtitle="Cálculo automático por funcionário" actions={
        <ExportButton
          onExportCSV={() => exportToCSV({ title: "Relatório de Comissões - GenOmni Salon", subtitle: "Detalhamento por funcionário", columns: exportColumns, data: exportRows, summary: exportSummary, filename: "relatorio-comissoes" })}
          onExportPDF={() => exportToPDF({ title: "Relatório de Comissões", subtitle: "Detalhamento por funcionário", columns: exportColumns, data: exportRows, summary: exportSummary, filename: "relatorio-comissoes" })}
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
          <CardTitle className="font-serif text-lg flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Detalhamento por Funcionário</CardTitle>
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
              {items.map((e) => (
                <TableRow key={e.id} className="hover:bg-secondary/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                        {String(e.name || "?").split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.role}</TableCell>
                  <TableCell className="text-right">{e.appointments}</TableCell>
                  <TableCell className="text-right">{formatKz(e.total_revenue)}</TableCell>
                  <TableCell className="text-right">{e.commission_rate}%</TableCell>
                  <TableCell className="text-right font-bold text-primary">{formatKz(e.commission_value)}</TableCell>
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
