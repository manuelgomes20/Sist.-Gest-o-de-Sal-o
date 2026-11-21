import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Agenda from "./pages/dashboard/Agenda";
import Clients from "./pages/dashboard/Clients";
import Employees from "./pages/dashboard/Employees";
import Services from "./pages/dashboard/Services";
import Financial from "./pages/dashboard/Financial";
import Cashier from "./pages/dashboard/Cashier";
import Commissions from "./pages/dashboard/Commissions";
import Stock from "./pages/dashboard/Stock";
import Receivables from "./pages/dashboard/Receivables";
import Audit from "./pages/dashboard/Audit";
import SettingsPage from "./pages/dashboard/Settings";
import SuperAdminLayout from "./components/SuperAdminLayout";
import SuperAdminHome from "./pages/super-admin/SuperAdminHome";
import Tenants from "./pages/super-admin/Tenants";
import Support from "./pages/super-admin/Support";
import Logs from "./pages/super-admin/Logs";
import SuperAdminSettings from "./pages/super-admin/Settings";
import SuperAdminFooter from "./pages/super-admin/Footer";
import SuperAdminBranding from "./pages/super-admin/Branding";
import SuperAdminLegal from "./pages/super-admin/LegalDocs";
import Legal from "./pages/Legal";
import Alerts from "./pages/dashboard/Alerts";
import Attendance from "./pages/dashboard/Attendance";
import Payroll from "./pages/dashboard/Payroll";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/legal/:type" element={<Legal />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="clients" element={<Clients />} />
            <Route path="employees" element={<Employees />} />
            <Route path="services" element={<Services />} />
            <Route path="financial" element={<Financial />} />
            <Route path="cashier" element={<Cashier />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="stock" element={<Stock />} />
            <Route path="receivables" element={<Receivables />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="audit" element={<Audit />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<SettingsPage />} />

          </Route>
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminHome />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="support" element={<Support />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="footer" element={<SuperAdminFooter />} />
            <Route path="branding" element={<SuperAdminBranding />} />
            <Route path="legal" element={<SuperAdminLegal />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
