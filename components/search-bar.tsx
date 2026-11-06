'use client';
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpRight, X } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { PlatformBadge } from '@/components/platform-badge';
import { useFilters } from '@/lib/store';
import { money, cn } from '@/lib/utils';
import type { Platform } from '@/types/product';
export function SearchBar({
  onSearch,
  initialQuery,
  loading,
}: {
  onSearch: (q: string) => void;
  initialQuery: string;
  loading: boolean;
}) {
  const [value, setValue] = useState(initialQuery);
  const f = useFilters();
  useEffect(() => setValue(initialQuery), [initialQuery]);
  return (
    <section className="sticky top-[66px] z-10 -mx-1 mb-7 bg-[#0c1012]/95 px-1 py-2 backdrop-blur-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSearch(value.trim());
        }}
        className="flex items-center gap-3 rounded-xl border border-white/[.12] bg-[#151a1e] p-2 pl-4 shadow-lg shadow-black/10 focus-within:border-emerald-400/40"
      >
        <Search className="shrink-0 text-emerald-400" size={21} />
        <input
          aria-label="Tìm sản phẩm"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search item across Shopee, Lazada, TikTok..."
          className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-600"
        />
        <kbd className="hidden rounded border border-white/10 px-1.5 py-1 text-[10px] text-zinc-500 sm:block">
          ↵
        </kbd>
        <Button disabled={loading || !value.trim()} type="submit" className="shrink-0 px-4 sm:px-6">
          {loading ? 'Đang quét...' : 'Tìm deal'}
          <ArrowUpRight size={15} />
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] text-zinc-500">Nền tảng</span>
          {(['All', 'Shopee', 'Lazada', 'TikTok Shop'] as const).map((p) => (
            <button
              key={p}
              onClick={() => f.setPlatform(p)}
              aria-pressed={f.platform === p}
              className={cn(
                'rounded-md border p-0.5 transition-colors',
                f.platform === p
                  ? 'border-emerald-400/35 bg-emerald-400/[.06]'
                  : 'border-transparent hover:bg-white/5',
              )}
            >
              {p === 'All' ? (
                <span className="inline-block px-3 py-1 text-[11px]">Tất cả</span>
              ) : (
                <PlatformBadge platform={p as Platform} small />
              )}
            </button>
          ))}
        </div>
        <div className="hidden h-5 w-px bg-white/10 xl:block" />
        <label className="flex items-center gap-3 text-[11px] text-zinc-500">
          Giá tối đa
          <input
            aria-label="Giá tối đa"
            type="range"
            min="100000"
            max="3000000"
            step="50000"
            value={f.maxPrice}
            onChange={(e) => f.setMaxPrice(Number(e.target.value))}
            className="w-20 sm:w-24"
          />
          <span className="w-20 text-zinc-300">{money(f.maxPrice)}</span>
        </label>
        <label className="ml-auto flex items-center gap-2 text-[11px] text-zinc-500">
          <SlidersHorizontal size={13} />
          Đánh giá tối thiểu
          <select
            aria-label="Đánh giá tối thiểu"
            value={f.minReviews}
            onChange={(e) => f.setMinReviews(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-[#151a1e] px-2 py-1.5 text-zinc-300"
          >
            {[0, 20, 100, 500, 1000].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        {(f.platform !== 'All' || f.minReviews !== 20 || f.maxPrice !== 3000000) && (
          <button
            aria-label="Xóa bộ lọc"
            onClick={f.reset}
            className="text-zinc-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </section>
  );
}
