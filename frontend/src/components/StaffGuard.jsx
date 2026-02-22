import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { StaffLayout } from '@/components/StaffLayout';

export function StaffGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Đang tải...</div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user.role !== 'staff' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return (
    <StaffLayout>
      <Outlet />
    </StaffLayout>
  );
}
