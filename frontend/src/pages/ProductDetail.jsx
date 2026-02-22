import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/useAuth';
import { useCart } from '@/context/CartContext';
import { useCartSidebar } from '@/context/CartSidebarContext';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { ShoppingCart, Truck, Shield, ChevronLeft, ChevronRight, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEHOLDER_IMG = 'https://picsum.photos/400/400';

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http') || url.startsWith('/');
}

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { openCartSidebar } = useCartSidebar();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentSending, setCommentSending] = useState(false);
  const [slideImageError, setSlideImageError] = useState(false);

  useEffect(() => {
    api.get(`/products/${slug}`).then((res) => {
      const p = res.data;
      setProduct(p);
      if (p.variants?.length) {
        setSelectedVariant(p.variants[0]);
      } else {
        setSelectedVariant(null);
      }
    }).catch(() => setProduct(null));
  }, [slug]);

  useEffect(() => {
    if (product?.id) {
      api.get(`/products/${slug}/comments`).then((res) => setComments(res.data)).catch(() => setComments([]));
    }
  }, [product?.id, slug]);

  const models = useMemo(() => {
    if (!product?.variants?.length) return [];
    const set = new Set(product.variants.map((v) => v.model_name));
    return Array.from(set);
  }, [product]);

  const colorsByModel = useMemo(() => {
    if (!product?.variants?.length || !selectedVariant) return [];
    return product.variants.filter((v) => v.model_name === selectedVariant.model_name);
  }, [product, selectedVariant]);

  const currentVariant = useMemo(() => {
    if (!selectedVariant) return null;
    const match = product?.variants?.find(
      (v) => v.model_name === selectedVariant.model_name && v.color_name === selectedVariant.color_name
    );
    return match || selectedVariant;
  }, [product, selectedVariant]);

  // Danh sách ảnh slideshow: ảnh biến thể đang chọn đầu tiên, rồi ảnh các biến thể khác, cuối là ảnh product
  const slideshowImages = useMemo(() => {
    if (!product) return [];
    const seen = new Set();
    const list = [];
    const add = (url) => {
      if (url && isValidImageUrl(url) && !seen.has(url)) {
        seen.add(url);
        list.push(url);
      }
    };
    if (currentVariant?.image) add(currentVariant.image);
    product.variants?.forEach((v) => v.image && add(v.image));
    if (product.image) add(product.image);
    if (list.length === 0) list.push(PLACEHOLDER_IMG);
    return list;
  }, [product, currentVariant]);

  useEffect(() => {
    setSlideIndex(0);
    setSlideImageError(false);
  }, [currentVariant?.id]);

  useEffect(() => {
    setSlideImageError(false);
  }, [slideIndex]);

  const price = currentVariant ? (currentVariant.sale_price ?? currentVariant.price) : 0;
  const stock = currentVariant?.stock ?? 0;

  const addToCart = () => {
    if (!currentVariant || !product) {
      alert('Vui lòng chọn mẫu mã và màu sắc.');
      return;
    }
    setAdding(true);
    addItem(currentVariant.id, quantity);
    openCartSidebar();
    setAdding(false);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!commentText.trim()) return;
    setCommentSending(true);
    try {
      const { data } = await api.post(`/products/${slug}/comments`, {
        content: commentText.trim(),
        rating: commentRating,
      });
      setComments((prev) => [data, ...prev]);
      setCommentText('');
      setCommentRating(5);
    } catch (err) {
      alert(err.response?.data?.message || 'Gửi bình luận thất bại');
    } finally {
      setCommentSending(false);
    }
  };

  if (!product) return <div className="py-12 text-center">Đang tải...</div>;

  const currentSlideUrl = slideshowImages[slideIndex];
  const hasValidSlide = currentSlideUrl && (currentSlideUrl.startsWith('http') || currentSlideUrl.startsWith('/'));

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <Card className="border-neutral-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-10">
          {/* Slideshow ảnh sản phẩm - mỗi biến thể dùng đúng ảnh của nó */}
          <div className="relative min-w-0 overflow-visible">
            <div className="aspect-square rounded-xl bg-gradient-to-b from-muted/80 to-muted flex items-center justify-center min-h-0 overflow-hidden">
              {hasValidSlide && !slideImageError ? (
                <img
                  src={currentSlideUrl}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-lg transition-opacity duration-300"
                  onError={() => setSlideImageError(true)}
                />
              ) : (
                <span className="text-9xl text-muted-foreground">📱</span>
              )}
            </div>
            {slideshowImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSlideIndex((i) => (i - 1 + slideshowImages.length) % slideshowImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center z-10 shadow-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSlideIndex((i) => (i + 1) % slideshowImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center z-10 shadow-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            {/* Ô vuông nhỏ thể hiện các ảnh thêm / biến thể */}
            <div className="flex flex-wrap justify-center gap-2 mt-3 overflow-visible">
              {slideshowImages.map((url, i) => {
                const isSelected = i === slideIndex;
                const validUrl = url && (url.startsWith('http') || url.startsWith('/'));
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSlideIndex(i);
                      setSlideImageError(false);
                    }}
                    className={cn(
                      'w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 overflow-hidden flex items-center justify-center bg-muted/50 shrink-0 transition-all',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                  >
                    {validUrl ? (
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const span = e.target.nextElementSibling;
                          if (span) span.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={cn('text-2xl text-muted-foreground', validUrl && 'hidden')}>📱</span>
                  </button>
                );
              })}
            </div>
            {currentVariant?.sale_price != null && (
              <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                Giảm {Math.round((1 - currentVariant.sale_price / currentVariant.price) * 100)}%
              </Badge>
            )}
          </div>

          {/* Thông tin */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {product.brand}
            </p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 leading-tight">
              {product.name}
            </h1>
            <p className="text-muted-foreground mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
              {product.description}
            </p>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                  {new Intl.NumberFormat('vi-VN').format(price)}₫
                </span>
                {currentVariant?.sale_price != null && (
                  <span className="text-lg text-muted-foreground line-through">
                    {new Intl.NumberFormat('vi-VN').format(currentVariant.price)}₫
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Tồn kho: <span className="font-medium text-foreground">{stock}</span>
              </p>
            </div>

            {models.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Chọn dung lượng / phiên bản</p>
                <div className="flex flex-wrap gap-2">
                  {models.map((m) => (
                    <Button
                      key={m}
                      variant={selectedVariant?.model_name === m ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const first = product.variants.find((v) => v.model_name === m);
                        setSelectedVariant(first || selectedVariant);
                      }}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {colorsByModel.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Chọn màu sắc</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {colorsByModel.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        'rounded-full border-2 p-0.5 transition-all',
                        currentVariant?.id === v.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-muted-foreground/30'
                      )}
                      title={v.color_name}
                    >
                      {v.color_hex ? (
                        <span
                          className="block w-8 h-8 rounded-full border border-neutral-300 shadow-inner"
                          style={{ backgroundColor: v.color_hex }}
                        />
                      ) : (
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium px-2 min-w-[2rem]">
                          {v.color_name.slice(0, 1)}
                        </span>
                      )}
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    {currentVariant?.color_name}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex items-center gap-2 border rounded-lg w-fit">
                <Button variant="ghost" size="icon" className="h-10 w-10 touch-manipulation" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</Button>
                <span className="w-10 text-center font-medium text-sm sm:text-base">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10 touch-manipulation" onClick={() => setQuantity((q) => Math.min(stock, q + 1))}>+</Button>
              </div>
              <Button
                className="w-full sm:flex-1 sm:min-w-[200px] h-11 sm:h-12 touch-manipulation"
                size="lg"
                onClick={addToCart}
                disabled={adding || stock < 1}
              >
                <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
                <span className="truncate">{adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</span>
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 shrink-0" />
                Giao hàng toàn quốc · Đơn từ 500K miễn phí
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 shrink-0" />
                Bảo hành chính hãng · Đổi trả 30 ngày
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bình luận */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 mb-3 sm:mb-4">
            <MessageCircle className="h-5 w-5" />
            Bình luận ({comments.length})
          </h2>

          {user && (
            <form onSubmit={submitComment} className="mb-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCommentRating(star)}
                      className="p-0.5 text-muted-foreground hover:text-amber-500"
                    >
                      <Star className={cn('h-5 w-5', commentRating >= star && 'fill-amber-500 text-amber-500')} />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">({commentRating}/5)</span>
                </div>
                <Input
                  placeholder="Viết bình luận..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px]"
                  maxLength={500}
                />
              </div>
              <Button type="submit" disabled={commentSending || !commentText.trim()} className="sm:self-end">
                {commentSending ? 'Đang gửi...' : 'Gửi'}
              </Button>
            </form>
          )}
          {!user && (
            <p className="text-sm text-muted-foreground mb-4">
              <button type="button" onClick={() => navigate('/login', { state: { from: location.pathname } })} className="text-primary underline">
                Đăng nhập
              </button>
              {' '}để bình luận.
            </p>
          )}

          <ul className="space-y-4">
            {comments.length === 0 && (
              <li className="text-sm text-muted-foreground py-4">Chưa có bình luận nào.</li>
            )}
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                <img
                  src={c.user_avatar || DEFAULT_AVATAR}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.user_name}</span>
                    {c.rating != null && (
                      <span className="flex items-center gap-0.5 text-amber-500 text-sm">
                        <Star className="h-4 w-4 fill-current" /> {c.rating}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
