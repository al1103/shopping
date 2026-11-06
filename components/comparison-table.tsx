'use client';
import { Fragment, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  Crown,
  Sparkles,
  Star,
  Truck,
  TriangleAlert,
} from 'lucide-react';
import type { AnalyzedProduct } from '@/types/product';
import { categorizeReviewsAndFilterNoise, categorizeReview } from '@/lib/scoring-engine';
import { PlatformBadge } from '@/components/platform-badge';
import { ProductImage, Score } from '@/components/product-card';
import { Button, Table, Tooltip } from '@/components/ui/primitives';
import { compact, money, cn } from '@/lib/utils';
import { useFilters } from '@/lib/store';
export function ReviewBreakdown({ product }: { product: AnalyzedProduct }) {
  const total = Object.values(product.ratingBreakdown).reduce((a, b) => a + b, 0);
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-[200px_1fr]">
      <div>
        <h4 className="mb-3 text-xs font-medium text-zinc-300">Phân bố đánh giá</h4>
        {([5, 4, 3, 2, 1] as const).map((star) => (
          <div className="mb-2 flex items-center gap-2 text-[10px] text-zinc-500" key={star}>
            <span>{star}</span>
            <Star size={10} />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  'h-full rounded-full',
                  star <= 2 ? 'bg-rose-400' : 'bg-emerald-400/70',
                )}
                style={{ width: `${total ? (product.ratingBreakdown[star] / total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-8 text-right">{compact(product.ratingBreakdown[star])}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { critical: false, label: 'Vận chuyển & đóng gói', Icon: Truck },
          { critical: true, label: 'Chất lượng sản phẩm', Icon: TriangleAlert },
        ].map(({ critical, label, Icon }) => {
          const reviews = product.negativeSampleReviews.filter((r) =>
            critical
              ? categorizeReview(r) === 'PRODUCT_QUALITY' ||
                categorizeReview(r) === 'SELLER_SERVICE'
              : categorizeReview(r) === 'LOGISTICS' || categorizeReview(r) === 'PACKAGING',
          );
          return (
            <div key={label}>
              <h4
                className={cn(
                  'mb-3 flex items-center gap-2 text-xs font-medium',
                  critical ? 'text-amber-300' : 'text-zinc-400',
                )}
              >
                <Icon size={13} />
                {label}
              </h4>
              {reviews.length ? (
                reviews.slice(0, 2).map((r, i) => (
                  <blockquote
                    key={i}
                    className="mb-2 border-l border-white/15 pl-3 text-[11px] leading-5 text-zinc-500"
                  >
                    “{r}”
                  </blockquote>
                ))
              ) : (
                <p className="text-[11px] text-zinc-600">Không có phản hồi trong mẫu.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function ComparisonTable({
  products,
  onAnalyze,
}: {
  products: AnalyzedProduct[];
  onAnalyze: (p: AnalyzedProduct) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const f = useFilters();
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[.08]">
      <Table className="min-w-[1020px]">
        <thead className="bg-[#151a1e] text-[10px] font-medium text-zinc-500">
          <tr>
            <th className="w-12 px-4 py-3.5">#</th>
            <th className="py-3.5">SẢN PHẨM</th>
            <th>NỀN TẢNG</th>
            <th>GIÁ BÁN</th>
            <th>ĐÁNH GIÁ</th>
            <th>
              <Tooltip text="Tỷ lệ đánh giá 1–2 sao trên tổng số đánh giá.">
                <span className="cursor-help border-b border-dashed border-zinc-600">
                  TỶ LỆ CHÊ
                </span>
              </Tooltip>
            </th>
            <th>LỖI THƯỜNG GẶP</th>
            <th>
              <span className="flex items-center gap-1 text-emerald-400">
                ĐIỂM PULSE
                <ArrowDown size={11} />
              </span>
            </th>
            <th className="pr-4 text-right">THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, index) => (
            <Fragment key={p.id}>
              <tr
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className={cn(
                  'group cursor-pointer border-t border-white/[.055] transition-colors hover:bg-white/[.025]',
                  index === 0 ? 'bg-emerald-400/[.025]' : 'bg-[#101518]',
                )}
              >
                <td className="px-4 py-5 text-xs text-zinc-500">
                  {index === 0 ? (
                    <Crown size={17} className="text-amber-300" />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </td>
                <td className="w-[290px] py-4 pr-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md border border-white/5 bg-[#20272a]">
                      <ProductImage product={p} className="h-14 w-16" />
                    </div>
                    <div>
                      <span className="line-clamp-1 max-w-48 text-xs font-medium text-zinc-200">
                        {p.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                        {p.shopName}
                        {p.isOfficialMall && <Check size={10} className="text-orange-400" />}
                      </span>
                      <button
                        className="mt-1.5 flex items-center gap-1 text-[9px] text-zinc-600 group-hover:text-zinc-400"
                        aria-expanded={expanded === p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(expanded === p.id ? null : p.id);
                        }}
                      >
                        <ChevronDown size={10} className={expanded === p.id ? 'rotate-180' : ''} />
                        Chi tiết đánh giá
                      </button>
                    </div>
                  </div>
                </td>
                <td>
                  <PlatformBadge platform={p.platform} small />
                </td>
                <td className="pr-3">
                  <span className="text-xs font-semibold text-zinc-200">{money(p.price)}</span>
                  {p.originalPrice > p.price && (
                    <span className="mt-1 block text-[10px] text-zinc-600 line-through">
                      {money(p.originalPrice)}
                    </span>
                  )}
                </td>
                <td className="pr-3">
                  <span className="flex items-center gap-1 text-xs">
                    <Star size={10} className="fill-amber-300 text-amber-300" />
                    {p.ratingAvg.toFixed(2)}
                  </span>
                  <span className="mt-1 block text-[10px] text-zinc-600">
                    {compact(p.reviewCount)} đánh giá
                  </span>
                </td>
                <td>
                  <span
                    className={cn(
                      'rounded-md px-2 py-1 font-mono text-[11px]',
                      p.negativeRatio > 0.05
                        ? 'bg-rose-400/10 text-rose-400'
                        : p.negativeRatio > 0.02
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-emerald-400/[.07] text-emerald-400',
                    )}
                  >
                    {(p.negativeRatio * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="max-w-36 pr-4">
                  <span className="line-clamp-2 text-[10px] leading-4 text-zinc-500">
                    {p.summarizedFlaws.length ? (
                      p.summarizedFlaws.join(', ')
                    ) : (
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Truck size={12} />
                        {categorizeReviewsAndFilterNoise(p.negativeSampleReviews).noiseRatio > 0.5
                          ? 'Chủ yếu vận chuyển'
                          : 'Chưa rõ lỗi phổ biến'}
                      </span>
                    )}
                  </span>
                  {p.criticalNegativeRatio > 0.08 && (
                    <span className="mt-1 block text-[9px] text-rose-400">
                      Rủi ro chất lượng cao
                    </span>
                  )}
                </td>
                <td>
                  <Score product={p} />
                  <span className="mt-1 block text-[8px] tracking-wider text-zinc-600">
                    {p.verdict.replace('_', ' ')}
                  </span>
                </td>
                <td className="pr-3">
                  <div className="flex justify-end gap-1">
                    <Tooltip text="Phân tích sâu rủi ro">
                      <Button
                        variant="ghost"
                        className="p-2"
                        aria-label={`Phân tích ${p.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnalyze(p);
                        }}
                      >
                        <Sparkles size={14} />
                      </Button>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      className="p-2"
                      aria-label={`Lưu ${p.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        f.toggleSave(p.id);
                      }}
                    >
                      <Bookmark
                        size={14}
                        className={
                          f.savedIds.includes(p.id) ? 'fill-emerald-400 text-emerald-400' : ''
                        }
                      />
                    </Button>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Mở nơi bán ${p.title}`}
                      className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-emerald-300"
                    >
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </td>
              </tr>
              {expanded === p.id && (
                <tr className="border-t border-white/5 bg-[#151b1d]">
                  <td colSpan={9}>
                    <ReviewBreakdown product={p} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
