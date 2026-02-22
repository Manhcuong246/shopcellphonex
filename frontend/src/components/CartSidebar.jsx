import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Trash2, Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CartSidebar({ open, onClose }) {
  const { items, loading, error, updateQty, removeItem, total } = useCart();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-[100%] sm:max-w-md bg-background border-l shadow-xl flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Giỏ hàng
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          {error && <p className="text-sm text-destructive mb-2">{error}</p>}
          {loading && items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải giỏ hàng...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="mb-4">Giỏ hàng trống</p>
              <Button asChild variant="outline" onClick={onClose}>
                <Link to="/products">Mua sắm ngay</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.variant_id} className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-card">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="object-contain max-h-full w-full h-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }} />
                    ) : null}
                    <span className={item.image ? 'hidden text-xl' : 'text-xl'}>📱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.slug}`}
                      className="font-medium text-sm line-clamp-2 hover:underline"
                      onClick={onClose}
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                    <p className="text-primary font-semibold text-sm mt-0.5">
                      {new Intl.NumberFormat('vi-VN').format(item.price)}₫
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQty(item.variant_id, Math.max(0, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={() => removeItem(item.variant_id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="p-3 sm:p-4 border-t bg-muted/30 shrink-0">
            <div className="flex justify-between items-center gap-2 mb-3">
              <span className="font-semibold text-sm sm:text-base">Tổng cộng</span>
              <span className="text-base sm:text-lg font-bold text-primary truncate">
                {new Intl.NumberFormat('vi-VN').format(total)}₫
              </span>
            </div>
            <Button asChild className="w-full" onClick={onClose}>
              <Link to="/checkout">Thanh toán</Link>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
