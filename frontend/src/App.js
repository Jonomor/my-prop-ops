import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantAuthProvider, useTenantAuth } from './contexts/TenantAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Tenants from './pages/Tenants';
import Inspections from './pages/Inspections';
import Documents from './pages/Documents';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import CreateOrganization from './pages/CreateOrganization';
import CalendarView from './pages/CalendarView';
import TeamManagement from './pages/TeamManagement';
import AcceptInvite from './pages/AcceptInvite';
import PendingInvites from './pages/PendingInvites';
import MemberDirectory from './pages/MemberDirectory';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Security from './pages/Security';
import Billing from './pages/Billing';
import Maintenance from './pages/Maintenance';
import Screening from './pages/Screening';
import RentPayments from './pages/RentPayments';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import ApiKeys from './pages/ApiKeys';
import Branding from './pages/Branding';

// Tenant Portal Pages
import TenantLogin from './pages/TenantLogin';
import TenantRegister from './pages/TenantRegister';
import TenantPortal from './pages/TenantPortal';

// Contractor Portal Pages
import ContractorLogin from './pages/ContractorLogin';
import ContractorRegister from './pages/ContractorRegister';
import ContractorDashboard from './pages/ContractorDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Tenant Portal Protected Route
const TenantProtectedRoute = ({ children }) => {
  const { tenant, loading } = useTenantAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (!tenant) {
    return <Navigate to="/tenant-portal/login" replace />;
  }
  
  return children;
};

// Tenant Portal Public Route (redirect to portal if logged in)
const TenantPublicRoute = ({ children }) => {
  const { tenant, loading } = useTenantAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (tenant) {
    return <Navigate to="/tenant-portal" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />
      
      {/* Contractor Portal Routes (separate auth) */}
      <Route path="/contractor/login" element={<ContractorLogin />} />
      <Route path="/contractor/register" element={<ContractorRegister />} />
      <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
      <Route path="/properties/:propertyId" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
      <Route path="/inspections" element={<ProtectedRoute><Inspections /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><MemberDirectory /></ProtectedRoute>} />
      <Route path="/invites" element={<ProtectedRoute><PendingInvites /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
      <Route path="/screening" element={<ProtectedRoute><Screening /></ProtectedRoute>} />
      <Route path="/rent-payments" element={<ProtectedRoute><RentPayments /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
      <Route path="/branding" element={<ProtectedRoute><Branding /></ProtectedRoute>} />
      <Route path="/organizations/new" element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}

// Tenant Portal Routes - separate from main app routes
function TenantPortalRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<TenantPublicRoute><TenantLogin /></TenantPublicRoute>} />
      <Route path="/register" element={<TenantPublicRoute><TenantRegister /></TenantPublicRoute>} />
      <Route path="/" element={<TenantProtectedRoute><TenantPortal /></TenantProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <TenantAuthProvider>
            <Routes>
              {/* Tenant Portal routes - handled separately with its own auth */}
              <Route path="/tenant-portal/*" element={<TenantPortalRoutes />} />
              
              {/* Main app routes */}
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </TenantAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
