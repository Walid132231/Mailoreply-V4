import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/NewAuthContext";
import Header from "@/components/Header";
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import HowItWorks from "@/pages/HowItWorks";
import Contact from "@/pages/Contact";
import About from "@/pages/About";

// Import dashboard page
import Dashboard from "@/pages/Dashboard";
import EnhancedDashboard from "@/pages/EnhancedDashboard";
import Settings from "@/pages/Settings";

// Import specialized pages (to be created)
import AIGenerator from "@/pages/AIGenerator";
import Templates from "@/pages/Templates";
import TeamManagement from "@/pages/TeamManagement";
import EnterpriseManagement from "@/pages/EnterpriseManagement";
import AdminSettings from "@/pages/AdminSettings";
import Analytics from "@/pages/Analytics";
import Subscription from "@/pages/Subscription";

// Placeholder for pages not yet implemented
import PlaceholderPage from "@/pages/PlaceholderPage";

function AppContent() {
  const location = useLocation();

  // Pages that should not show the main header (dashboard pages use their own layout)
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  // For dashboard pages, render without any wrapper
  if (isDashboardPage) {
    return (
      <Routes>
        {/* Dashboard - Role-based routing */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        {/* Dashboard Sub-pages */}
        <Route path="/dashboard/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/ai-generator" element={
          <ProtectedRoute>
            <AIGenerator />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/templates" element={
          <ProtectedRoute>
            <Templates />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/team" element={
          <ProtectedRoute requireRole={['enterprise_manager']}>
            <TeamManagement />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/enterprise" element={
          <ProtectedRoute requireRole={['superuser']}>
            <EnterpriseManagement />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/admin-settings" element={
          <ProtectedRoute requireRole={['superuser']}>
            <AdminSettings />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/subscription" element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } />
      </Routes>
    );
  }

  // For non-dashboard pages, render with header and container
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Index />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Setup is complete - redirect to login */}
        <Route path="/setup" element={<Login />} />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

// Enhanced Dashboard Router Component with role-specific features
function DashboardRouter() {
  return <EnhancedDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
