import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, Laptop, Headphones, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { HeroSlideshow } from '@/components/HeroSlideshow';
import { FALLBACK_PRODUCT_IMAGE } from '@/lib/constants';

const categoryIcons = {
  'dien-thoai': Smartphone,
  'laptop': Laptop,
  'tai-nghe': Headphones,
  'phu-kien': Zap,
};

export function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/products?limit=24').then((res) => setProducts(res.data));
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-14">
      <HeroSlideshow />

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link
          to="/products?category=dien-thoai"
          className="group relative rounded-lg sm:rounded-xl overflow-hidden h-28 sm:h-36 md:h-40 text-white p-4 sm:p-6 flex flex-col justify-end bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%), url(https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=85)`,
          }}
        >
          <span className="text-xs sm:text-sm font-medium opacity-90">Giảm đến 15%</span>
          <h3 className="text-base sm:text-lg md:text-xl font-bold mt-0.5 sm:mt-1">Điện thoại flagship</h3>
          <span className="text-xs sm:text-sm mt-0.5 sm:mt-1 opacity-90 group-hover:underline">Xem ngay →</span>
        </Link>
        <Link
          to="/products?category=tai-nghe"
          className="group relative rounded-lg sm:rounded-xl overflow-hidden h-28 sm:h-36 md:h-40 text-white p-4 sm:p-6 flex flex-col justify-end bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%), url(https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=85)`,
          }}
        >
          <span className="text-xs sm:text-sm font-medium opacity-90">Mới ra mắt</span>
          <h3 className="text-base sm:text-lg md:text-xl font-bold mt-0.5 sm:mt-1">Tai nghe chống ồn</h3>
          <span className="text-xs sm:text-sm mt-0.5 sm:mt-1 opacity-90 group-hover:underline">Khám phá →</span>
        </Link>
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">Danh mục</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((c) => {
              const Icon = categoryIcons[c.slug] || Smartphone;
              return (
                <Link
                  key={c.id}
                  to={`/products?category=${c.slug}`}
                  className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-lg sm:rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all touch-manipulation"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <span className="font-medium text-center text-sm sm:text-base">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Sản phẩm nổi bật</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/products" className="flex items-center gap-1 text-sm">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products.slice(0, 24).map((p) => (
            <Link key={p.id} to={`/products/${p.slug}`} className="touch-manipulation">
              <Card className="overflow-hidden h-full transition-all hover:shadow-lg active:scale-[0.98] sm:hover:-translate-y-0.5 border-neutral-200">
                <div className="aspect-square bg-muted/50 flex items-center justify-center p-2 sm:p-4">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="object-contain max-h-full w-full h-full" onError={(e) => { const t = e.target; t.onerror = null; t.src = FALLBACK_PRODUCT_IMAGE; }} />
                  ) : (
                    <img src={FALLBACK_PRODUCT_IMAGE} alt={p.name} className="object-contain max-h-full w-full h-full" />
                  )}
                  <span className="hidden text-5xl text-muted-foreground">📱</span>
                </div>
                <CardContent className="p-3 sm:p-4">
                  <p className="font-medium line-clamp-2 text-foreground text-sm sm:text-base">{p.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{p.brand}</p>
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
      </section>
    </div>
  );
}
