import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function StaffProducts() {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', category_id: '', description: '', brand: '', variants: [{ model_name: 'Mặc định', color_name: 'Đen', price: '', sale_price: '', stock: 0 }] });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/staff/products'), api.get('/categories')])
      .then(([pr, cat]) => {
        setList(pr.data);
        setCategories(cat.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      brand: '',
      variants: [{ model_name: 'Mặc định', color_name: 'Đen', price: '', sale_price: '', stock: 0 }],
    });
    setModal('add');
  };

  const openEdit = (p) => {
    api.get('/staff/products/' + p.id).then((res) => {
      const d = res.data;
      setForm({
        name: d.name,
        category_id: d.category_id,
        description: d.description || '',
        brand: d.brand || '',
        variants: (d.variants || []).length ? d.variants.map((v) => ({
          model_name: v.model_name,
          color_name: v.color_name,
          color_hex: v.color_hex,
          price: v.price,
          sale_price: v.sale_price ?? '',
          stock: v.stock ?? 0,
        })) : [{ model_name: 'Mặc định', color_name: 'Đen', price: '', sale_price: '', stock: 0 }],
      });
      setModal({ id: d.id });
    });
  };

  const addVariant = () => {
    setForm((f) => ({ ...f, variants: [...f.variants, { model_name: 'Mặc định', color_name: '', price: '', sale_price: '', stock: 0 }] }));
  };

  const removeVariant = (i) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  };

  const updateVariant = (i, field, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v),
    }));
  };

  const save = () => {
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      variants: form.variants
        .filter((v) => Number(v.price) > 0)
        .map((v) => ({
          model_name: v.model_name || 'Mặc định',
          color_name: v.color_name || 'Đen',
          color_hex: v.color_hex || null,
          price: Number(v.price),
          sale_price: v.sale_price !== '' && v.sale_price != null ? Number(v.sale_price) : null,
          stock: Math.max(0, parseInt(v.stock, 10) || 0),
        })),
    };
    if (!payload.name || !payload.category_id) return;
    if (!payload.variants.length) return alert('Cần ít nhất 1 biến thể có giá.');
    setSaving(true);
    const isEdit = modal?.id;
    (isEdit ? api.patch('/staff/products/' + modal.id, payload) : api.post('/staff/products', payload))
      .then(() => { setModal(null); load(); })
      .catch((err) => alert(err.response?.data?.message || 'Lỗi lưu'))
      .finally(() => setSaving(false));
  };

  const deleteProduct = (id) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    setDeleting(id);
    api.delete('/staff/products/' + id)
      .then(() => load())
      .catch((err) => alert(err.response?.data?.message || 'Lỗi xóa'))
      .finally(() => setDeleting(null));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Sản phẩm</h1>
        <Button onClick={openAdd}>Thêm sản phẩm</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Tên</th>
                  <th className="text-left p-3 hidden sm:table-cell">Danh mục</th>
                  <th className="text-left p-3">Tồn kho</th>
                  <th className="text-right p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{p.category_name}</td>
                    <td className="p-3">{p.stock ?? 0}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Sửa</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}>
                        {deleting === p.id ? '...' : 'Xóa'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && !loading && <p className="p-6 text-center text-muted-foreground">Chưa có sản phẩm</p>}
        </CardContent>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !saving && setModal(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{modal === 'add' ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => !saving && setModal(null)}>Đóng</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tên sản phẩm</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tên" />
              </div>
              <div>
                <Label>Danh mục</Label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Mô tả (tùy chọn)</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Mô tả"
                />
              </div>
              <div>
                <Label>Thương hiệu (tùy chọn)</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Brand" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Biến thể (mẫu, màu, giá, tồn kho)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>+ Thêm</Button>
                </div>
                <div className="space-y-2">
                  {form.variants.map((v, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-center p-2 border rounded-md">
                      <Input placeholder="Mẫu" value={v.model_name} onChange={(e) => updateVariant(i, 'model_name', e.target.value)} className="w-24" />
                      <Input placeholder="Màu" value={v.color_name} onChange={(e) => updateVariant(i, 'color_name', e.target.value)} className="w-24" />
                      <Input type="number" placeholder="Giá" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="w-28" />
                      <Input type="number" placeholder="Giá KM" value={v.sale_price} onChange={(e) => updateVariant(i, 'sale_price', e.target.value)} className="w-24" />
                      <Input type="number" placeholder="Tồn" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} className="w-20" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(i)}>Xóa</Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={save} disabled={saving} className="w-full">{saving ? 'Đang lưu...' : 'Lưu'}</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
