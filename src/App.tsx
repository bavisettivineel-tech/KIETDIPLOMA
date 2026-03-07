import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Users from "./pages/Users";
import Attendance from "./pages/Attendance";
import Marks from "./pages/Marks";
import Fees from "./pages/Fees";
import Transport from "./pages/Transport";
import Notices from "./pages/Notices";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, requireNonStudent }: { children: React.ReactNode, requireNonStudent?: boolean }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading KIET POLYTECHNIC…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireNonStudent && user?.role === "student") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/marks" element={<ProtectedRoute><Marks /></ProtectedRoute>} />
      <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />

      <Route path="/students" element={<ProtectedRoute requireNonStudent><Students /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute requireNonStudent><Users /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute requireNonStudent><Attendance /></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute requireNonStudent><Fees /></ProtectedRoute>} />
      <Route path="/transport" element={<ProtectedRoute requireNonStudent><Transport /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute requireNonStudent><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute requireNonStudent><SettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
