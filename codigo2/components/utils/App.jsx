import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ProfileProvider } from '@/lib/ProfileContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Units from '@/pages/Units';
import Finances from '@/pages/Finances';
import Occurrences from '@/pages/Occurrences';
import Notices from '@/pages/Notices';
import Reservations from '@/pages/Reservations';
import Maintenances from '@/pages/Maintenances';
import WorkOrders from '@/pages/WorkOrders';
import Deliveries from '@/pages/Deliveries';
import GateControl from '@/pages/GateControl';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/units" element={<Units />} />
          <Route path="/finances" element={<Finances />} />
          <Route path="/occurrences" element={<Occurrences />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/maintenances" element={<Maintenances />} />
          <Route path="/workorders" element={<WorkOrders />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/gate" element={<GateControl />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}

export default App