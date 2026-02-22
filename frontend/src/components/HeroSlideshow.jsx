import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Ảnh hero: chỉ dùng ảnh sản phẩm, không dải màu (overlay tối nhẹ bên trái để chữ rõ)
const slides = [
  {
    id: 1,
    title: 'iPhone 15 Pro Max',
    subtitle: 'Chip A17 Pro · Camera 48MP · Titan',
    cta: 'Mua ngay',
    link: '/products/iphone-15-pro-max',
    image: 'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-4.jpg',
  },
  {
    id: 2,
    title: 'Samsung Galaxy S24 Ultra',
    subtitle: 'Bút S Pen · Camera 200MP · AI',
    cta: 'Khám phá',
    link: '/products/samsung-galaxy-s24-ultra',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200&q=85',
  },
  {
    id: 3,
    title: 'MacBook Pro M3',
    subtitle: 'Chip M3 · Màn hình Liquid Retina XDR',
    cta: 'Xem thêm',
    link: '/products/macbook-pro-m3',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80',
  },
];

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative rounded-xl sm:rounded-2xl overflow-hidden h-[220px] sm:h-[280px] md:h-[360px] lg:h-[400px] mb-6 sm:mb-10 md:mb-12 shadow-xl">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-500 flex items-center',
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          {/* Ảnh nền sản phẩm - không dải màu, chỉ lớp tối nhẹ bên trái cho chữ */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)',
            }}
          />
          <div className="relative z-10 container px-4 sm:px-6 md:px-10 flex flex-col justify-center">
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-md max-w-[85%] sm:max-w-xl">
              {slide.title}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mt-1 sm:mt-2 mb-3 sm:mb-6 max-w-[90%] sm:max-w-md">
              {slide.subtitle}
            </p>
            <Button asChild className="w-fit h-9 px-4 text-sm sm:h-11 sm:px-6 sm:text-base bg-white text-slate-900 hover:bg-white/90">
              <Link to={slide.link}>{slide.cta}</Link>
            </Button>
          </div>
        </div>
      ))}
      <button
        type="button"
        aria-label="Slide trước"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors touch-manipulation"
        onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        aria-label="Slide sau"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors touch-manipulation"
        onClick={() => setCurrent((c) => (c + 1) % slides.length)}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            className={cn(
              'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all touch-manipulation',
              i === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
            )}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </section>
  );
}
