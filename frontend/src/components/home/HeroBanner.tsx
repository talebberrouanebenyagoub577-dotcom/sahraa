"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  titleAr?: string | null;
  subtitle?: string | null;
  subtitleAr?: string | null;
  image: string;
  link?: string | null;
}

export function HeroBanner({ banners }: { banners: Banner[] }) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: isRtl ? "rtl" : "ltr" }, [
    Autoplay({ delay: 5000 }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (!banners.length) {
    return (
      <div className="relative h-[300px] bg-gradient-to-r from-amber-500 to-amber-600 md:h-[450px]">
        <div className="flex h-full items-center justify-center px-8 text-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 md:text-5xl">
              {isRtl ? "تسوق بذكاء، ادفع عند الاستلام" : "Shop Smart, Pay on Delivery"}
            </h1>
            <p className="mt-4 text-lg text-slate-800">
              {isRtl ? "أفضل المنتجات في دول الخليج" : "Best products across the GCC"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((banner) => {
            const content = (
              <div key={banner.id} className="relative min-w-0 flex-[0_0_100%]">
                <div className="relative h-[300px] md:h-[450px]">
                  <Image
                    src={banner.image}
                    alt={isRtl ? banner.titleAr || banner.title : banner.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized={banner.image.startsWith("http")}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 start-0 p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-white md:text-4xl">
                      {isRtl ? banner.titleAr || banner.title : banner.title}
                    </h2>
                    {(banner.subtitle || banner.subtitleAr) && (
                      <p className="mt-2 text-lg text-white/90">
                        {isRtl ? banner.subtitleAr || banner.subtitle : banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );

            return banner.link ? (
              <Link key={banner.id} href={banner.link} className="min-w-0 flex-[0_0_100%]">
                {content}
              </Link>
            ) : (
              content
            );
          })}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute start-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === selectedIndex ? "w-6 bg-amber-500" : "w-2 bg-white/60"
            }`}
            onClick={() => emblaApi?.scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
