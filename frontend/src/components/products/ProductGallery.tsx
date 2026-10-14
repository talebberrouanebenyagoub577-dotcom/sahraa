"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Package,
  Play,
  X,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
  captionTitle?: string | null;
  caption?: string | null;
};

export function ProductGallery({
  images,
  videoUrl,
  productName,
}: {
  images: GalleryImage[];
  videoUrl?: string | null;
  productName: string;
}) {
  const t = useTranslations("product");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);
  const activeImage = images[activeIndex];

  const previous = useCallback(() => {
    setShowVideo(false);
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setShowVideo(false);
    setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, next, previous]);

  const markFailed = (url: string) => {
    setFailedImages((current) => new Set(current).add(url));
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || images.length < 2) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > 45) {
      if (distance > 0) previous();
      else next();
    }
    touchStartX.current = null;
  };

  const mediaFrame = (fullscreen = false) => {
    if (showVideo && videoUrl) {
      return (
        <video
          controls
          playsInline
          preload="metadata"
          className="h-full w-full bg-black object-contain"
          aria-label={t("productVideo")}
        >
          <source src={videoUrl} />
        </video>
      );
    }

    if (!activeImage || failedImages.has(activeImage.url)) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
          <Package className="h-16 w-16" />
          <span className="text-sm">{t("imageUnavailable")}</span>
        </div>
      );
    }

    return (
      <Image
        src={activeImage.url}
        alt={activeImage.alt || `${productName} ${activeIndex + 1}`}
        fill
        priority={activeIndex === 0 && !fullscreen}
        sizes={
          fullscreen
            ? "100vw"
            : "(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 42vw"
        }
        onError={() => markFailed(activeImage.url)}
        className={cn(
          "object-contain",
          !fullscreen &&
            "transition-transform duration-300 lg:group-hover/main:scale-[1.35]"
        )}
      />
    );
  };

  return (
    <>
      <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row">
        {(images.length > 1 || videoUrl) && (
          <div
            className="flex shrink-0 gap-2 overflow-x-auto pb-1 sm:w-[72px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden"
            aria-label={t("galleryThumbnails")}
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setShowVideo(false);
                }}
                aria-label={t("showImage", { number: index + 1 })}
                aria-current={!showVideo && index === activeIndex}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  !showVideo && index === activeIndex
                    ? "border-amber-500"
                    : "border-slate-200 hover:border-slate-400"
                )}
              >
                {failedImages.has(image.url) ? (
                  <Package className="m-auto h-6 w-6 text-slate-400" />
                ) : (
                  <Image
                    src={image.url}
                    alt={image.alt || ""}
                    fill
                    sizes="72px"
                    loading="lazy"
                    onError={() => markFailed(image.url)}
                    className="object-cover"
                  />
                )}
              </button>
            ))}
            {videoUrl && (
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                aria-label={t("playProductVideo")}
                aria-current={showVideo}
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 bg-slate-950 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  showVideo ? "border-amber-500" : "border-slate-200"
                )}
              >
                <Play className="h-6 w-6 fill-current" />
              </button>
            )}
          </div>
        )}

        <div
          className="group/main relative aspect-square min-w-0 flex-1 touch-pan-y overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0].clientX;
          }}
          onTouchEnd={onTouchEnd}
        >
          {mediaFrame()}

          {!showVideo && activeImage && (
            <div className="pointer-events-none absolute end-3 top-3 hidden items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white lg:flex">
              <ZoomIn className="h-3.5 w-3.5" />
              {t("hoverToZoom")}
            </div>
          )}

          {!showVideo && activeImage && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-3 end-3 rounded-full bg-white/95 p-2.5 text-slate-900 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label={t("openFullscreen")}
            >
              <Expand className="h-5 w-5" />
            </button>
          )}

          {!showVideo && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={t("previousImage")}
              >
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={t("nextImage")}
              >
                <ChevronRight className="h-5 w-5 rtl:rotate-180" />
              </button>
              <span className="absolute bottom-3 start-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                {activeIndex + 1}/{images.length}
              </span>
            </>
          )}
        </div>
      </div>

      {!showVideo &&
        (activeImage?.captionTitle ||
          activeImage?.caption ||
          activeImage?.alt) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
            {activeImage.captionTitle && (
              <p className="font-bold text-slate-900">
                {activeImage.captionTitle}
              </p>
            )}
            <p
              className={`text-sm leading-7 ${
                activeImage.captionTitle ? "mt-1.5" : ""
              }`}
            >
              {activeImage.caption || activeImage.alt}
            </p>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("imageViewer")}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute end-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={t("closeViewer")}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative h-[85vh] w-[92vw]">{mediaFrame(true)}</div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                className="absolute start-4 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label={t("previousImage")}
              >
                <ChevronLeft className="h-7 w-7 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute end-4 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label={t("nextImage")}
              >
                <ChevronRight className="h-7 w-7 rtl:rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
