'use client';
import {
  Crown,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Check,
  Bookmark,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AnalyzedProduct } from '@/types/product';
import { Badge, Button, Card, Tooltip } from '@/components/ui/primitives';
import { PlatformBadge } from '@/components/platform-badge';
import { compact, money, cn } from '@/lib/utils';
import { useFilters } from '@/lib/store';
import { categorizeReviewsAndFilterNoise } from '@/lib/scoring-engine';
export function ProductImage({
  product,
  className,
}: {
  product: AnalyzedProduct;
  className?: string;
}) {
  return (
    <img
      src={product.thumbnail}
      alt={product.title}
      loading="lazy"
      decoding="async"
      width={640}
      height={400}
      className={cn('object-contain', className)}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = '/products/placeholder.svg';
      }}
    />
  );
}
export function Score({ product }: { product: AnalyzedProduct }) {
  return (
    <Tooltip text="35% đánh giá Bayesian · 40% chất lượng · 25% giá. Phạt 35% nếu tỷ lệ chê > 5%.">
      <span
        className={cn(
          'inline-flex items-baseline gap-0.5 rounded-lg border px-2.5 py-1 font-mono text-base font-semibold',
          product.finalScore >= 85
            ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
            : product.finalScore >= 70
              ? 'border-cyan-400/15 bg-cyan-400/10 text-cyan-300'
              : 'border-rose-400/15 bg-rose-400/10 text-rose-300',
        )}
      >
        {product.finalScore.toFixed(1)}
        <span className="text-[9px] font-normal opacity-50">/100</span>
      </span>
    </Tooltip>
  );
}
export function CrownPick({
  product,
  onAnalyze,
}: {
  product: AnalyzedProduct;
  onAnalyze: (p: AnalyzedProduct) => void;
}) {
  const f = useFilters();
  const savings = Math.max(0, product.originalPrice - product.price);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hero-grid relative overflow-hidden rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/[.055] via-[#121a1a] to-[#121619] shadow-[0_0_35px_-20px_#34d39960]"
    >
      <div className="flex items-center justify-between border-b border-emerald-400/10 px-5 py-3.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[.14em] text-amber-300">
          <Crown size={16} />
          CROWN PICK
          <span className="ml-2 hidden text-[10px] font-normal tracking-normal text-zinc-500 sm:inline">
            Lựa chọn tốt nhất dành cho bạn
          </span>
        </div>
        <Badge className="bg-emerald-400/10 text-emerald-300">
          <ShieldCheck size={11} />
          {product.reviewCount < 20
            ? 'Ít dữ liệu'
            : product.verdict === 'BEST_PICK' || product.verdict === 'SOLID_BUY'
              ? 'Rủi ro thấp'
              : 'Cần cân nhắc'}
        </Badge>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[210px_1fr]">
        <div className="relative flex min-h-44 items-center justify-center rounded-lg bg-gradient-to-br from-[#26322f] to-[#182023]">
          <span className="absolute left-3 top-3 text-[9px] tracking-wider text-zinc-400">
            SMART CHOICE / 01
          </span>
          <ProductImage product={product} className="w-full scale-110" />
          <Badge className="absolute bottom-3 left-3 bg-black/35 text-zinc-300 backdrop-blur">
            {savings > 0 ? `Tiết kiệm ${money(savings)}` : 'Giá cạnh tranh'}
          </Badge>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <PlatformBadge platform={product.platform} />
            {product.isOfficialMall && (
              <Badge className="text-orange-300">
                <BadgeCheck size={11} />
                Mall chính hãng
              </Badge>
            )}
          </div>
          <h2 className="mt-3 text-xl font-semibold leading-snug tracking-tight">
            {product.title}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
            {product.shopName}
            <Check size={11} className="text-emerald-400" />
            <span className="mx-1">·</span>
            <Star size={11} className="fill-amber-300 text-amber-300" />
            <span className="text-zinc-300">{product.ratingAvg}</span> (
            {compact(product.reviewCount)} đánh giá)
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[28px] font-semibold tracking-tight text-emerald-300">
              {money(product.price)}
            </span>
            {savings > 0 && (
              <>
                <span className="text-xs text-zinc-600 line-through">
                  {money(product.originalPrice)}
                </span>
                <Badge className="bg-emerald-400/10 text-emerald-400">
                  -{Math.round((savings / product.originalPrice) * 100)}%
                </Badge>
              </>
            )}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[.04] px-3 py-2.5">
            <Sparkles size={13} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-[11px] leading-relaxed text-zinc-400">
              <span className="font-medium text-emerald-300">Pulse Insight: </span>
              {product.summarizedFlaws.length
                ? product.summarizedFlaws.join(' · ')
                : categorizeReviewsAndFilterNoise(product.negativeSampleReviews).noiseRatio > 0.5
                  ? 'Phàn nàn chủ yếu về vận chuyển. Chưa phát hiện lỗi chất lượng rõ ràng trong mẫu.'
                  : 'Chưa đủ mẫu phản hồi để xác định lỗi chất lượng thường gặp.'}{' '}
              Điểm tin cậy Bayesian {product.bayesianScore.toFixed(2)}/5.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
            >
              Tới nơi bán
              <ArrowUpRight size={14} />
            </a>
            <Button variant="outline" className="px-3 text-xs" onClick={() => onAnalyze(product)}>
              <Sparkles size={13} />
              Phân tích sâu
            </Button>
            <Button
              variant="ghost"
              className="ml-auto p-2"
              aria-label="Lưu Crown Pick"
              onClick={() => f.toggleSave(product.id)}
            >
              <Bookmark
                size={17}
                className={
                  f.savedIds.includes(product.id) ? 'fill-emerald-400 text-emerald-400' : ''
                }
              />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
export function ProductCard({
  product,
  index,
  onAnalyze,
}: {
  product: AnalyzedProduct;
  index: number;
  onAnalyze: (p: AnalyzedProduct) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <PlatformBadge platform={product.platform} />
        <span className="text-xs text-zinc-600">#{index + 1}</span>
      </div>
      <div className="my-3 rounded-lg bg-white/[.025]">
        <ProductImage product={product} className="h-36 w-full" />
      </div>
      <h3 className="min-h-10 text-sm font-medium">{product.title}</h3>
      <p className="mt-1 text-[11px] text-zinc-500">{product.shopName}</p>
      <div className="my-4 flex items-center justify-between">
        <strong className="text-emerald-300">{money(product.price)}</strong>
        <Score product={product} />
      </div>
      <Button variant="outline" className="w-full text-xs" onClick={() => onAnalyze(product)}>
        <Sparkles size={13} />
        Phân tích sâu rủi ro
      </Button>
    </Card>
  );
}
