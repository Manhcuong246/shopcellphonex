import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { CartSidebarProvider } from '@/context/CartSidebarContext';
import { Layout } from '@/components/Layout';
import { AdminGuard } from '@/components/AdminGuard';
import { StaffGuard } from '@/components/StaffGuard';
import { Home } from '@/pages/Home';
import { Products } from '@/pages/Products';
import { ProductDetail } from '@/pages/ProductDetail';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { Orders } from '@/pages/Orders';
import { Settings } from '@/pages/Settings';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { StaffDashboard } from '@/pages/staff/StaffDashboard';
import { StaffOrders } from '@/pages/staff/StaffOrders';
import { StaffProducts } from '@/pages/staff/StaffProducts';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <CartSidebarProvider>
            <Routes>
              <Route path="/admin" element={<AdminGuard />}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
              <Route path="/staff" element={<StaffGuard />}>
                <Route index element={<StaffDashboard />} />
                <Route path="orders" element={<StaffOrders />} />
                <Route path="products" element={<StaffProducts />} />
              </Route>
              <Route element={<Layout><Outlet /></Layout>}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </CartSidebarProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
