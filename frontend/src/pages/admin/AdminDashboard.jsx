import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};
const STATUS_COLORS = {
  pending: '#94a3b8',
  confirmed: '#3b82f6',
  shipping: '#f59e0b',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    api.get('/admin/stats').then((res) => { if (!c) setData(res.data); }).catch(() => { if (!c) setData(null); }).finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 sm:h-80 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Không có dữ liệu</CardContent>
      </Card>
    );
  }

  const { revenueByDay, summary, topProducts, statusCounts } = data;
  const revenueChart = (revenueByDay || []).map((r) => ({
    date: r.date,
    doanhThu: Number(r.total) || 0,
    don: Number(r.count) || 0,
  }));
  const pieData = (statusCounts || [])
    .map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: Number(s.count) || 0,
      color: STATUS_COLORS[s.status] || '#64748b',
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Tổng quan</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">
              {new Intl.NumberFormat('vi-VN').format(summary?.today_revenue || 0)} ₫
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{summary?.today_orders ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn chờ xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{summary?.pending_orders ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SP / KH</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{summary?.total_products ?? 0} / {summary?.total_customers ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Doanh thu 30 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v / 1e6).toFixed(0) + 'M'} />
                  <Tooltip formatter={(value) => [new Intl.NumberFormat('vi-VN').format(value) + ' ₫', 'Doanh thu']} />
                  <Area type="monotone" dataKey="doanhThu" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Trạng thái đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => name + ': ' + value}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Chưa có đơn hàng
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {topProducts && topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Top sản phẩm (30 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topProducts.slice(0, 5).map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm">
                  <span className="truncate flex-1 mr-2">
                    {p.product_name}
                    {p.variant_label ? ' - ' + p.variant_label : ''}
                  </span>
                  <Badge variant="secondary">{p.sold} bán</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
