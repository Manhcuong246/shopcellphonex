import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Menu, X, Smartphone, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/useAuth';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/staff', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/staff/orders', label: 'Đơn hàng', icon: Package },
  { to: '/staff/products', label: 'Sản phẩm', icon: ShoppingBag },
];

export function StaffLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      <aside className="hidden md:flex md:w-56 lg:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex h-14 items-center gap-2 px-4 border-b">
          <Smartphone className="h-6 w-6 text-primary" />
          <span className="font-semibold">Nhân viên</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/staff'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground truncate px-2">{user?.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start mt-1" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-md hover:bg-muted"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <Link to="/staff" className="flex items-center gap-2 font-semibold">
          <Smartphone className="h-6 w-6 text-primary" />
          Nhân viên
        </Link>
      </header>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r md:hidden flex flex-col">
            <div className="flex h-14 items-center gap-2 px-4 border-b">
              <Smartphone className="h-6 w-6 text-primary" />
              <span className="font-semibold">Nhân viên</span>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-auto">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/staff'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t">
              <p className="text-xs text-muted-foreground truncate px-2">{user?.email}</p>
              <Button variant="ghost" size="sm" className="w-full justify-start mt-1" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 md:pl-56 lg:pl-64 min-h-screen">
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
