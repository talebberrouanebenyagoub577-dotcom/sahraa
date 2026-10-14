"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/products/ReviewForm";

type ReviewItem = {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  images: string[];
  isVerified: boolean;
  createdAt: Date | string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
};

type DistributionItem = { rating: number; count: number };

function Stars({ rating, large = false }: { rating: number; large?: boolean }) {
  return (
    <span
      className={`inline-flex text-amber-400 ${large ? "text-2xl" : "text-base"}`}
      aria-label={`${rating}/5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? "" : "text-slate-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ProductReviews({
  productId,
  initialReviews,
  initialDistribution,
  average,
  total,
}: {
  productId: string;
  initialReviews: ReviewItem[];
  initialDistribution: DistributionItem[];
  average: number;
  total: number;
}) {
  const locale = useLocale();
  const t = useTranslations("product");
  const [reviews, setReviews] = useState(initialReviews);
  const [distribution, setDistribution] = useState(initialDistribution);
  const [reviewTotal, setReviewTotal] = useState(total);
  const [reviewAverage, setReviewAverage] = useState(average);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 6;
  const hasMore = reviews.length < reviewTotal;

  const fetchPage = async (targetPage: number, replace = false) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        productId,
        page: String(targetPage),
        limit: String(pageSize),
      });
      const res = await apiFetch(`/api/reviews?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("reviewsLoadFailed"));

      const payload = json.data;
      setReviews((current) =>
        replace
          ? payload.reviews
          : [
              ...current,
              ...payload.reviews.filter(
                (review: ReviewItem) =>
                  !current.some((item) => item.id === review.id)
              ),
            ]
      );
      setDistribution(payload.distribution);
      setReviewTotal(payload.pagination.total);
      setReviewAverage(payload.average);
      setPage(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reviewsLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="customer-reviews" className="scroll-mt-24 border-t border-slate-200 pt-10">
      <h2 className="text-2xl font-bold">{t("customerExperiences")}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {t("peopleUsedIt", { count: reviewTotal })}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold">{reviewAverage.toFixed(1)}</span>
            <div>
              <Stars rating={reviewAverage} large />
              <p className="text-xs text-slate-500">
                {t("basedOnReviews", { count: reviewTotal })}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count =
                distribution.find((item) => item.rating === rating)?.count ?? 0;
              const width = reviewTotal > 0 ? (count / reviewTotal) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2 text-xs">
                  <span className="w-8">{rating} ★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-[width]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-6 text-end">{count}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <div>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-amber-100 font-bold text-amber-700">
                      {review.user.avatar ? (
                        <Image
                          src={review.user.avatar}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        review.user.firstName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {review.user.firstName} {review.user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat(
                          locale === "ar" ? "ar-SA" : "en-US",
                          { dateStyle: "medium" }
                        ).format(new Date(review.createdAt))}
                      </p>
                    </div>
                    {review.isVerified && (
                      <p className="ms-auto flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("verifiedPurchase")}</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    {review.title && <h3 className="font-bold">{review.title}</h3>}
                  </div>
                  <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">
                    {review.comment}
                  </p>
                  {review.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.images.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200"
                        >
                          <Image
                            src={url}
                            alt={t("reviewImage", { number: index + 1 })}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold">{t("noReviewsYet")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("beFirstReview")}</p>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {hasMore && (
            <Button
              type="button"
              variant="outline"
              className="mt-5 w-full sm:w-auto"
              onClick={() => fetchPage(page + 1)}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("loadMoreReviews")}
            </Button>
          )}

          <ReviewForm
            productId={productId}
            onSubmitted={() => fetchPage(1, true)}
          />
        </div>
      </div>
    </section>
  );
}
