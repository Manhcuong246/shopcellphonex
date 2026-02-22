import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/useAuth';
import { useCart } from '@/context/CartContext';

export function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items: cart, loading: cartLoading, total, clearCart } = useCart();
  const [shipping_address, setShippingAddress] = useState('');
  const [shipping_phone, setShippingPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (user.role === 'admin' || user.role === 'staff') {
      navigate('/', { replace: true });
      return;
    }
    setShippingAddress(user.address || '');
    setShippingPhone(user.phone || '');
  }, [user, navigate]);

  if (user?.role === 'admin' || user?.role === 'staff') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shipping_address.trim() || !shipping_phone.trim()) {
      alert('Vui lòng nhập địa chỉ và số điện thoại giao hàng');
      return;
    }
    if (cart.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    setLoading(true);
    try {
      const items = cart.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        variant_label: i.variant_label,
        product_name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));
      await api.post('/orders', {
        shipping_address: shipping_address.trim(),
        shipping_phone: shipping_phone.trim(),
        note: note.trim() || undefined,
        items,
      });
      clearCart();
      navigate('/orders');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (cartLoading && cart.length === 0) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">Đang tải giỏ hàng...</div>;
  }
  if (cart.length === 0 && total === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <p className="text-muted-foreground">Giỏ hàng trống. Không thể thanh toán.</p>
        <Button className="mt-4" onClick={() => navigate('/products')}>Mua sắm</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Thanh toán</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Thông tin giao hàng</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ giao hàng</Label>
              <Input
                id="address"
                value={shipping_address}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                value={shipping_phone}
                onChange={(e) => setShippingPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho đơn hàng (tùy chọn)"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-sm sm:text-base">Tổng thanh toán</span>
            <span className="text-lg sm:text-xl font-bold text-primary">
              {new Intl.NumberFormat('vi-VN').format(total)}₫
            </span>
          </CardHeader>
          <CardContent>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
