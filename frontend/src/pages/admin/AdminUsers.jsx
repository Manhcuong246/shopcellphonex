import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/useAuth';

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Khách hàng' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'admin', label: 'Admin' },
];
const ROLE_VARIANTS = { customer: 'secondary', staff: 'default', admin: 'destructive' };

export function AdminUsers() {
  const { user: me } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/users')
      .then((res) => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const changeRole = (userId, role) => {
    setUpdating(userId);
    api.patch('/admin/users/' + userId + '/role', { role })
      .then(() => setList((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u))))
      .catch((err) => alert(err.response?.data?.message || 'Không thể đổi role'))
      .finally(() => setUpdating(null));
  };

  if (loading && list.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Người dùng</h1>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3 hidden sm:table-cell">Tên</th>
                  <th className="text-left p-3">Vai trò</th>
                  <th className="text-right p-3">Đổi vai trò</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{u.email}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{u.full_name}</td>
                    <td className="p-3">
                      <Badge variant={ROLE_VARIANTS[u.role] || 'secondary'}>
                        {ROLE_OPTIONS.find((r) => r.value === u.role)?.label || u.role}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {u.id === me?.id ? (
                        <span className="text-muted-foreground text-xs">(bạn)</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          disabled={updating === u.id}
                          className="rounded-md border bg-background px-2 py-1 text-xs"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && !loading && <p className="p-6 text-center text-muted-foreground">Chưa có user</p>}
        </CardContent>
      </Card>
    </div>
  );
}
