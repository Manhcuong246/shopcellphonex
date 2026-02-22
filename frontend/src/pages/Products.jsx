import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '@/api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FALLBACK_PRODUCT_IMAGE } from '@/lib/constants';

export function Products() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    api.get(`/products?${params}`).then((res) => setProducts(res.data));
  }, [category, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Sản phẩm</h1>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm sản phẩm..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button variant={!category ? 'default' : 'outline'} size="sm" className="text-xs sm:text-sm" asChild>
            <Link to="/products">Tất cả</Link>
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={category === c.slug ? 'default' : 'outline'}
              size="sm"
              className="text-xs sm:text-sm"
              asChild
            >
              <Link to={`/products?category=${c.slug}`}>{c.name}</Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {products.map((p) => (
          <Link key={p.id} to={`/products/${p.slug}`} className="touch-manipulation">
            <Card className="overflow-hidden hover:shadow-md active:scale-[0.98] transition-shadow h-full">
              <div className="aspect-square bg-muted flex items-center justify-center p-2 sm:p-4">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="object-contain max-h-full w-full h-full" onError={(e) => { const t = e.target; t.onerror = null; t.src = FALLBACK_PRODUCT_IMAGE; }} />
                ) : (
                  <img src={FALLBACK_PRODUCT_IMAGE} alt={p.name} className="object-contain max-h-full w-full h-full" />
                )}
                <span className="hidden text-4xl text-muted-foreground">📱</span>
              </div>
              <CardContent className="p-3 sm:p-4">
                <p className="font-medium line-clamp-2 text-sm sm:text-base">{p.name}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                    <span className="font-semibold text-primary text-sm sm:text-base">
                      {new Intl.NumberFormat('vi-VN').format(p.sale_price ?? p.price)}₫
                    </span>
                    {p.sale_price != null && (
                      <span className="text-xs sm:text-sm text-muted-foreground line-through">
                        {new Intl.NumberFormat('vi-VN').format(p.price)}₫
                      </span>
                    )}
                  </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Không tìm thấy sản phẩm.</p>
      )}
    </div>
  );
}
