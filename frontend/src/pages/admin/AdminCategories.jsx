import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminCategories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | { id, name, slug, description }
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/categories')
      .then((res) => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name: '', slug: '', description: '' });
    setModal('add');
  };

  const openEdit = (c) => {
    setForm({ name: c.name, slug: c.slug, description: c.description || '' });
    setModal({ id: c.id });
  };

  const save = () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const isEdit = modal?.id;
    const payload = { name: form.name.trim(), slug: form.slug.trim() || undefined, description: form.description.trim() || null };
    (isEdit ? api.patch('/admin/categories/' + modal.id, payload) : api.post('/admin/categories', payload))
      .then(() => { setModal(null); load(); })
      .catch((err) => alert(err.response?.data?.message || 'Lỗi lưu'))
      .finally(() => setSaving(false));
  };

  const deleteCat = (id) => {
    if (!confirm('Xóa danh mục? Sản phẩm thuộc danh mục sẽ không bị xóa nhưng cần chọn lại danh mục.')) return;
    setDeleting(id);
    api.delete('/admin/categories/' + id)
      .then(() => load())
      .catch((err) => alert(err.response?.data?.message || 'Lỗi xóa (có thể đang có sản phẩm)'))
      .finally(() => setDeleting(null));
  };

  if (loading && list.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Danh mục</h1>
        <Button onClick={openAdd}>Thêm danh mục</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Tên</th>
                  <th className="text-left p-3">Slug</th>
                  <th className="text-right p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.slug}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Sửa</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCat(c.id)} disabled={deleting === c.id}>
                        {deleting === c.id ? '...' : 'Xóa'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && !loading && <p className="p-6 text-center text-muted-foreground">Chưa có danh mục</p>}
        </CardContent>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !saving && setModal(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{modal === 'add' ? 'Thêm danh mục' : 'Sửa danh mục'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => !saving && setModal(null)}>Đóng</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tên</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tên danh mục" />
              </div>
              <div>
                <Label>Slug (tùy chọn, tự tạo nếu để trống)</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="slug-danh-muc" />
              </div>
              <div>
                <Label>Mô tả (tùy chọn)</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]"
                  placeholder="Mô tả"
                />
              </div>
              <Button onClick={save} disabled={saving} className="w-full">{saving ? 'Đang lưu...' : 'Lưu'}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
