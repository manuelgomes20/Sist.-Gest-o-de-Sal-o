import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import ExportButton from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockFinancial, formatKz } from "@/data/mockData";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";
import { salesEngine, useSalesEngine } from "@/lib/salesEngine";

const COLORS = ["hsl(350, 65%, 52%)", "hsl(35, 80%, 56%)", "hsl(200, 60%, 50%)", "hsl(150, 50%, 45%)"];

const Financial = () => {
  // Live aggregates
  const _movements = useSalesEngine(s => s.movements);
  const _receivables = useSalesEngine(s => s.receivables);
  const today = new Date().toISOString().split("T")[0];
  const liveTodayRevenue = salesEngine.getCashSummary(today).entradas;
  const liveMonthRevenue = salesEngine.getCashSummary().entradas;
  const livePending = salesEngine.getReceivablesOpenTotal();
  const dailyRevenue = mockFinancial.dailyRevenue + liveTodayRevenue;
  const monthlyRevenue = mockFinancial.monthlyRevenue + liveMonthRevenue;
  const pendingPayments = mockFinancial.pendingPayments + livePending;

  const handleExportCSV = () => {
    const data = mockFinancial.revenueByMonth.map(m => ({
      month: m.month,
      revenue: m.revenue,
      expenses: m.expenses,
      profit: m.revenue - m.expenses,
    }));
    exportToCSV({
      title: "Relatório Financeiro - GenOmni Salon",
      subtitle: "Receitas e Despesas Mensais",
      columns: [
        { header: "Mês", key: "month" },
        { header: "Receita", key: "revenue", format: "currency" },
        { header: "Despesas", key: "expenses", format: "currency" },
        { header: "Lucro", key: "profit", format: "currency" },
      ],
      data,
      summary: [
        { label: "Receita Hoje", value: formatKz(mockFinancial.dailyRevenue) },
        { label: "Receita Mensal", value: formatKz(mockFinancial.monthlyRevenue) },
        { label: "Despesas Mensal", value: formatKz(mockFinancial.monthlyExpenses) },
      ],
      filename: "relatorio-financeiro",
    });
  };

  const handleExportPDF = () => {
    const data = mockFinancial.revenueByMonth.map(m => ({
      month: m.month,
      revenue: m.revenue,
      expenses: m.expenses,
      profit: m.revenue - m.expenses,
    }));
    exportToPDF({
      title: "Relatório Financeiro",
      subtitle: "Receitas e Despesas Mensais",
      columns: [
        { header: "Mês", key: "month" },
        { header: "Receita", key: "revenue", format: "currency" },
        { header: "Despesas", key: "expenses", format: "currency" },
        { header: "Lucro", key: "profit", format: "currency" },
      ],
      data,
      summary: [
        { label: "Receita Hoje", value: formatKz(mockFinancial.dailyRevenue) },
        { label: "Receita Mensal", value: formatKz(mockFinancial.monthlyRevenue) },
        { label: "Despesas", value: formatKz(mockFinancial.monthlyExpenses) },
        { label: "A Receber", value: formatKz(mockFinancial.pendingPayments) },
      ],
      filename: "relatorio-financeiro",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" subtitle="Visão geral das finanças" actions={
        <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
      } />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receita Hoje" value={formatKz(dailyRevenue)} icon={TrendingUp} />
        <StatCard title="Receita Mensal" value={formatKz(monthlyRevenue)} icon={DollarSign} trend={{ value: 15, positive: true }} />
        <StatCard title="Despesas Mensal" value={formatKz(mockFinancial.monthlyExpenses)} icon={TrendingDown} />
        <StatCard title="A Receber" value={formatKz(pendingPayments)} icon={AlertCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <CardTitle className="font-serif text-lg flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Receitas x Despesas</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockFinancial.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
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
                <Pie data={mockFinancial.revenueByService} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {mockFinancial.revenueByService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
