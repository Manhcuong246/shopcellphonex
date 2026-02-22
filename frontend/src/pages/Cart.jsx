import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/useAuth';
import { Trash2, Minus, Plus } from 'lucide-react';

export function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, loading, updateQty, removeItem, total } = useCart();

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (user?.role === 'admin' || user?.role === 'staff') {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 px-0 sm:px-0">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Giỏ hàng</h1>
      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Đang tải giỏ hàng...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Giỏ hàng trống. <Link to="/products" className="text-primary underline">Mua sắm ngay</Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.variant_id}>
                <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="object-contain max-h-full w-full h-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }} />
                    ) : null}
                    <span className={item.image ? 'hidden text-2xl' : 'text-2xl'}>📱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.slug}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.variant_label}</p>
                    <p className="text-primary font-semibold mt-1">
                      {new Intl.NumberFormat('vi-VN').format(item.price)}₫
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.variant_id, Math.max(0, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.variant_id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-base sm:text-lg font-semibold">Tổng cộng</span>
                <span className="text-lg sm:text-xl font-bold text-primary truncate">
                  {new Intl.NumberFormat('vi-VN').format(total)}₫
                </span>
              </div>
              <Button asChild className="w-full">
                <Link to="/checkout">Thanh toán</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
