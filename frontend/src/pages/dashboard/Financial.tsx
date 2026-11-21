import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import ExportButton from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";
import { toast } from "sonner";

const COLORS = ["hsl(350, 65%, 52%)", "hsl(35, 80%, 56%)", "hsl(200, 60%, 50%)", "hsl(150, 50%, 45%)"];

const emptySummary = {
  daily_revenue: 0,
  monthly_revenue: 0,
  daily_expenses: 0,
  monthly_expenses: 0,
  pending_payments: 0,
  revenue_by_month: [],
  revenue_by_service: [],
};

const Financial = () => {
  const [summary, setSummary] = useState<any>(emptySummary);

  useEffect(() => {
    api.financial.summary()
      .then(data => setSummary({ ...emptySummary, ...data }))
      .catch((error: any) => toast.error(error.message || "Erro ao carregar financeiro"));
  }, []);

  const monthlyRows = (summary.revenue_by_month || []).map((m: any) => ({
    month: m.month,
    revenue: Number(m.revenue || m.value || 0),
    expenses: Number(m.expenses || 0),
    profit: Number(m.revenue || m.value || 0) - Number(m.expenses || 0),
  }));
  const serviceRows = summary.revenue_by_service || [];

  const handleExportCSV = () => exportToCSV({
    title: "Relatório Financeiro - GenOmni Salon",
    subtitle: "Receitas e Despesas Mensais",
    columns: [
      { header: "Mês", key: "month" },
      { header: "Receita", key: "revenue", format: "currency" },
      { header: "Despesas", key: "expenses", format: "currency" },
      { header: "Lucro", key: "profit", format: "currency" },
    ],
    data: monthlyRows,
    summary: [
      { label: "Receita Hoje", value: formatKz(summary.daily_revenue) },
      { label: "Receita Mensal", value: formatKz(summary.monthly_revenue) },
      { label: "Despesas Mensal", value: formatKz(summary.monthly_expenses) },
    ],
    filename: "relatorio-financeiro",
  });

  const handleExportPDF = () => exportToPDF({
    title: "Relatório Financeiro",
    subtitle: "Receitas e Despesas Mensais",
    columns: [
      { header: "Mês", key: "month" },
      { header: "Receita", key: "revenue", format: "currency" },
      { header: "Despesas", key: "expenses", format: "currency" },
      { header: "Lucro", key: "profit", format: "currency" },
    ],
    data: monthlyRows,
    summary: [
      { label: "Receita Hoje", value: formatKz(summary.daily_revenue) },
      { label: "Receita Mensal", value: formatKz(summary.monthly_revenue) },
      { label: "Despesas", value: formatKz(summary.monthly_expenses) },
      { label: "A Receber", value: formatKz(summary.pending_payments) },
    ],
    filename: "relatorio-financeiro",
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" subtitle="Visão geral das finanças" actions={<ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receita Hoje" value={formatKz(summary.daily_revenue)} icon={TrendingUp} />
        <StatCard title="Receita Mensal" value={formatKz(summary.monthly_revenue)} icon={DollarSign} trend={{ value: 15, positive: true }} />
        <StatCard title="Despesas Mensal" value={formatKz(summary.monthly_expenses)} icon={TrendingDown} />
        <StatCard title="A Receber" value={formatKz(summary.pending_payments)} icon={AlertCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <CardTitle className="font-serif text-lg flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Receitas x Despesas</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value: number) => [formatKz(value)]} />
                <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <CardTitle className="font-serif text-lg flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-primary" /> Receita por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={serviceRows} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {serviceRows.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [formatKz(value)]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financial;
