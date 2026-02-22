import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/useAuth';

export function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    api.get('/orders').then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;
  if (loading) return <div className="py-12 text-center">Đang tải...</div>;

  const statusLabel = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Bạn chưa có đơn hàng nào.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6">
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base">Đơn #{order.id}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="w-fit text-xs sm:text-sm">
                  {statusLabel[order.status] || order.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2 sm:line-clamp-none">Địa chỉ: {order.shipping_address}</p>
                <ul className="border-t pt-2 space-y-1 text-xs sm:text-sm">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex flex-col sm:flex-row justify-between gap-0.5">
                      <span className="truncate">
                        {item.product_name}
                        {item.variant_label ? ` (${item.variant_label})` : ''} x {item.quantity}
                      </span>
                      <span className="shrink-0">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}₫</span>
                    </li>
                  ))}
                </ul>
                <p className="font-semibold mt-2 text-right text-sm sm:text-base">
                  Tổng: {new Intl.NumberFormat('vi-VN').format(order.total)}₫
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
