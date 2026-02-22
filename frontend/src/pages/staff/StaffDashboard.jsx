import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const STATUS_LABELS = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' };

export function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/staff/stats').then((res) => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="h-40 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const recent = data?.recent || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Tổng quan đơn hàng</h1>
      <p className="text-sm text-muted-foreground">Nhân viên chỉ xem và xử lý đơn hàng, không xem doanh thu hay quản lý sản phẩm.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn chờ xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{summary.pending_orders ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{summary.today_orders ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang xử lý / giao</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{summary.processing_orders ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Đơn hàng gần đây</CardTitle>
          <Link to="/staff/orders" className="text-sm text-primary hover:underline">
            Xem tất cả
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đơn hàng</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((order) => (
                <li key={order.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <span>#{order.id} · {order.customer_name} · {new Intl.NumberFormat('vi-VN').format(order.total)} ₫</span>
                  <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                    {STATUS_LABELS[order.status] || order.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
