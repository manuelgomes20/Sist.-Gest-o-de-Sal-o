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
import Attendance from "./pages/dashboard/Attendance";
import Payroll from "./pages/dashboard/Payroll";
import Alerts from "./pages/dashboard/Alerts";
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
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/legal/:type" element={<Legal />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="tenant">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="agenda" element={<ProtectedRoute role="tenant" permission="agenda"><Agenda /></ProtectedRoute>} />
              <Route path="clients" element={<ProtectedRoute role="tenant" permission="clients"><Clients /></ProtectedRoute>} />
              <Route path="employees" element={<ProtectedRoute role="tenant" permission="employees"><Employees /></ProtectedRoute>} />
              <Route path="services" element={<ProtectedRoute role="tenant" permission="services"><Services /></ProtectedRoute>} />
              <Route path="financial" element={<ProtectedRoute role="tenant" permission="financial"><Financial /></ProtectedRoute>} />
              <Route path="cashier" element={<ProtectedRoute role="tenant" permission="cashier"><Cashier /></ProtectedRoute>} />
              <Route path="commissions" element={<ProtectedRoute role="tenant" permission="commissions"><Commissions /></ProtectedRoute>} />
              <Route path="receivables" element={<ProtectedRoute role="tenant" permission="receivables"><Receivables /></ProtectedRoute>} />
              <Route path="attendance" element={<ProtectedRoute role="tenant" permission="attendance"><Attendance /></ProtectedRoute>} />
              <Route path="payroll" element={<ProtectedRoute role="tenant" permission="payroll"><Payroll /></ProtectedRoute>} />
              <Route path="stock" element={<ProtectedRoute role="tenant" permission="stock"><Stock /></ProtectedRoute>} />
              <Route path="alerts" element={<ProtectedRoute role="tenant" permission="alerts"><Alerts /></ProtectedRoute>} />
              <Route path="audit" element={<ProtectedRoute role="tenant" permission="audit"><Audit /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute role="tenant" permission="settings"><SettingsPage /></ProtectedRoute>} />
            </Route>

            <Route
              path="/super-admin"
              element={
                <ProtectedRoute role="super_admin">
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
