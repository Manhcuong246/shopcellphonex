import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];
const STATUS_VARIANTS = {
  pending: 'secondary',
  confirmed: 'default',
  shipping: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

export function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    api
      .get('/staff/orders?' + params.toString())
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const onSearch = () => fetchOrders();

  const updateStatus = (orderId, status) => {
    setUpdating(orderId);
    api
      .patch('/staff/orders/' + orderId + '/status', { status })
      .then(() => {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      })
      .catch(() => {})
      .finally(() => setUpdating(null));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Đơn hàng</h1>
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm max-w-[200px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Input
            placeholder="Tìm ID, tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="flex-1 min-w-[140px]"
          />
          <Button variant="secondary" size="sm" onClick={onSearch}>Lọc</Button>
        </div>
      </Card>
      <div className="space-y-3 sm:space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Chưa có đơn hàng</CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">
                    Đơn #{order.id} · {order.customer_name || order.customer_email}
                  </CardTitle>
                  <Badge variant={STATUS_VARIANTS[order.status] || 'secondary'}>
                    {STATUS_OPTIONS.find((o) => o.value === order.status)?.label || order.status}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleString('vi-VN')} · Tổng {new Intl.NumberFormat('vi-VN').format(order.total)} ₫
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm space-y-1">
                  {(order.items || []).map((item, i) => (
                    <li key={i}>
                      {item.product_name}
                      {item.variant_label ? ' (' + item.variant_label + ')' : ''} × {item.quantity} — {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} ₫
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">Trạng thái:</span>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {updating === order.id && <span className="text-xs text-muted-foreground">Đang cập nhật...</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
