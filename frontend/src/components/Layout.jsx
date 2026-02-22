import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, Smartphone, ChevronDown, Settings, Package, LayoutDashboard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/useAuth';
import { useCart } from '@/context/CartContext';
import { useCartSidebar } from '@/context/CartSidebarContext';
import { CartSidebar } from '@/components/CartSidebar';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { open, openCartSidebar, closeCartSidebar } = useCartSidebar();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 font-semibold text-base sm:text-xl min-w-0 shrink">
            <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" />
            <span className="truncate">Cellphone Shop</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <Link to="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md whitespace-nowrap">
              Sản phẩm
            </Link>
            {user?.role !== 'admin' && user?.role !== 'staff' && (
              <button
                type="button"
                onClick={openCartSidebar}
                className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground touch-manipulation"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="h-5 w-5 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            )}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground min-w-0"
                >
                  <img
                    src={user.avatar || DEFAULT_AVATAR}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover border border-muted shrink-0"
                  />
                  <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px] md:max-w-[180px]">
                    {user.full_name}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', userMenuOpen && 'rotate-180')} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-md border bg-background shadow-lg">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Quản trị
                      </Link>
                    )}
                    {(user.role === 'staff' || user.role === 'admin') && (
                      <Link
                        to="/staff"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Users className="h-4 w-4" />
                        Nhân viên
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      Đơn hàng
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Cài đặt
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-4 sm:py-6">{children}</main>
      <footer className="border-t bg-muted/50 py-6 sm:py-8">
        <div className="container text-center text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} Cellphone Shop. Đồ điện tử chính hãng.
        </div>
      </footer>
      <CartSidebar open={open} onClose={closeCartSidebar} />
    </div>
  );
}
