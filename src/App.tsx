import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import PortfolioDetail from "./pages/PortfolioDetail";
import Services from "./pages/Services";
import RequestQuote from "./pages/RequestQuote";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PublicQuote from "./pages/PublicQuote";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminQuotes from "./pages/admin/AdminQuotes";
import AdminNewQuote from "./pages/admin/AdminNewQuote";
import AdminQuoteDetail from "./pages/admin/AdminQuoteDetail";
import AdminClients from "./pages/admin/AdminClients";
import AdminNewClient from "./pages/admin/AdminNewClient";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminRequestDetail from "./pages/admin/AdminRequestDetail";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminServices from "./pages/admin/AdminServices";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminReports from "./pages/admin/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes with Layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio/:id" element={<PortfolioDetail />} />
              <Route path="/servicos" element={<Services />} />
              <Route path="/solicitar-orcamento" element={<RequestQuote />} />
              <Route path="/proposta/:token" element={<PublicQuote />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/termos" element={<Terms />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="solicitacoes" element={<AdminRequests />} />
              <Route path="solicitacoes/:id" element={<AdminRequestDetail />} />
              <Route path="orcamentos" element={<AdminQuotes />} />
              <Route path="orcamentos/novo" element={<AdminNewQuote />} />
              <Route path="orcamentos/:id" element={<AdminQuoteDetail />} />
              <Route path="clientes" element={<AdminClients />} />
              <Route path="clientes/novo" element={<AdminNewClient />} />
              <Route path="clientes/:id" element={<AdminClientDetail />} />
              <Route path="servicos" element={<AdminServices />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="faturas" element={<AdminInvoices />} />
              <Route path="tarefas" element={<AdminTasks />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="relatorios" element={<AdminReports />} />
              <Route path="configuracoes" element={<AdminSettings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
