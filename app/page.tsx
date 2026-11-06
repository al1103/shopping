'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  AudioLines,
  Bookmark,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Database,
  ExternalLink,
  Grid2X2,
  Info,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  TrendingDown,
  Zap,
} from 'lucide-react';
import type { AnalyzedProduct } from '@/types/product';
import type { SearchResponse } from '@/lib/types';
import { SearchBar } from '@/components/search-bar';
import { CrownPick, ProductCard } from '@/components/product-card';
import { ComparisonTable } from '@/components/comparison-table';
import { ReviewBreakdownModal } from '@/components/review-breakdown-modal';
import { Badge, Button, Card, Dialog, Skeleton } from '@/components/ui/primitives';
import { useFilters } from '@/lib/store';
import { cn, money } from '@/lib/utils';
const suggestions = ['bàn phím cơ núm xoay', 'sạc dự phòng 20w', 'áo hoodie zip'];
function LoadingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 3), 800);
    return () => clearInterval(id);
  }, []);
  return (
    <div aria-live="polite">
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-4 text-xs text-emerald-300">
        <LoaderCircle size={16} className="animate-spin" />
        {
          [
            'Đang quét Shopee...',
            'Đang kiểm tra 1-star reviews Lazada...',
            'Đang phân tích chất lượng TikTok Shop...',
          ][step]
        }
        <span className="ml-auto text-zinc-600">Dữ liệu mô phỏng</span>
      </div>
      <Skeleton className="mb-6 h-80" />
      <div className="flex gap-4">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="mb-6 h-24 flex-1" />
        ))}
      </div>
      {[1, 2, 3, 4].map((n) => (
        <Skeleton key={n} className="mb-2 h-20" />
      ))}
    </div>
  );
}
export default function Home() {
  const [query, setQuery] = useState('bàn phím cơ');
  const [selected, setSelected] = useState<AnalyzedProduct | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const f = useFilters();
  const result = useQuery<SearchResponse>({
    queryKey: ['products', query, f.platform, f.minReviews],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q: query, minReviews: String(f.minReviews) });
      if (f.platform !== 'All') params.set('platform', f.platform);
      const response = await fetch(`/api/search?${params}`, { signal });
      if (!response.ok) throw new Error('Không thể tải dữ liệu. Vui lòng thử lại.');
      return response.json();
    },
  });
  const products = useMemo(
    () =>
      (result.data?.items ?? []).filter(
        (p) => p.price <= f.maxPrice && (!f.savedOnly || f.savedIds.includes(p.id)),
      ),
    [result.data, f.maxPrice, f.savedOnly, f.savedIds],
  );
  const best = products[0];
  const riskyCount = products.filter((p) => p.verdict === 'AVOID' || p.verdict === 'RISKY').length;
  const potentialSaving = best ? Math.max(0, best.originalPrice - best.price) : 0;
  function navigate(saved: boolean) {
    f.setSavedOnly(saved);
    setMobileNav(false);
  }
  return (
    <div className="min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[216px] flex-col border-r border-white/[.065] bg-[#101416] px-4 py-7 transition-transform lg:translate-x-0',
          mobileNav ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible',
        )}
      >
        <a href="/" className="mb-1 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-zinc-950 shadow-[0_0_20px_#34d39915]">
            <AudioLines size={23} strokeWidth={2.5} />
          </span>
          <span className="text-xl font-bold tracking-tight">
            dealpulse<span className="text-emerald-400">.</span>
            <span className="ml-1 align-top text-[9px] font-medium text-zinc-500">VN</span>
          </span>
        </a>
        <p className="mb-10 pl-[53px] text-[9px] tracking-wide text-zinc-600">
          LESS NOISE. BETTER DEALS.
        </p>
        <div className="mb-3 px-3 text-[9px] font-medium tracking-[.17em] text-zinc-600">
          WORKSPACE
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => navigate(false)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs',
              !f.savedOnly
                ? 'bg-emerald-400/[.09] font-medium text-emerald-300'
                : 'text-zinc-500 hover:bg-white/5',
            )}
          >
            <LayoutDashboard size={16} />
            Khám phá deal
            {!f.savedOnly && <span className="ml-auto h-1 w-1 rounded-full bg-emerald-400" />}
          </button>
          <button
            onClick={() => navigate(true)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs',
              f.savedOnly
                ? 'bg-emerald-400/[.09] text-emerald-300'
                : 'text-zinc-500 hover:bg-white/5',
            )}
          >
            <Bookmark size={16} />
            Deal đã lưu
            <span className="ml-auto rounded bg-white/5 px-1.5 py-0.5 text-[9px]">
              {f.savedIds.length}
            </span>
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs text-zinc-500 hover:bg-white/5"
          >
            <ChartNoAxesCombined size={16} />
            Cách tính Pulse Score
            <ChevronRight size={13} className="ml-auto" />
          </button>
        </nav>
        <div className="mt-9 border-t border-white/5 pt-5">
          <p className="px-3 text-[9px] font-medium tracking-[.17em] text-zinc-600">
            KẾT NỐI NỀN TẢNG
          </p>
          {[
            { name: 'Shopee', color: 'bg-orange-400', letter: 'S' },
            { name: 'Lazada', color: 'bg-violet-400', letter: 'L' },
            { name: 'TikTok Shop', color: 'bg-cyan-300', letter: '♪' },
          ].map((p) => (
            <div key={p.name} className="mt-5 flex items-center gap-3 px-3 text-xs text-zinc-500">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-zinc-950',
                  p.color,
                )}
              >
                {p.letter}
              </span>
              {p.name}
              <span className="ml-auto text-[8px] text-zinc-600">DEMO</span>
            </div>
          ))}
        </div>
        <Card className="mt-auto bg-gradient-to-br from-emerald-400/[.06] to-transparent p-3.5">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
            <ShieldCheck size={15} className="text-emerald-400" />
            Mua sắm tỉnh táo hơn
          </div>
          <p className="text-[10px] leading-5 text-zinc-500">
            Không chỉ tìm giá rẻ.
            <br />
            Tìm sản phẩm xứng đáng.
          </p>
          <button
            onClick={() => setHelpOpen(true)}
            className="mt-3 flex items-center gap-1 text-[10px] text-emerald-300"
          >
            Tìm hiểu cách hoạt động
            <ArrowRight size={11} />
          </button>
        </Card>
        <div className="mt-5 flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-300">
            DP
          </div>
          <div>
            <p className="text-[10px] text-zinc-300">Deal hunter</p>
            <p className="text-[9px] text-zinc-600">Personal workspace</p>
          </div>
          <span className="ml-auto rounded border border-white/10 px-1.5 py-0.5 text-[8px] text-zinc-500">
            FREE
          </span>
        </div>
      </aside>
      {mobileNav && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="lg:ml-[216px]">
        <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between gap-3 border-b border-white/[.065] bg-[#0c1012]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3 text-[11px]">
            <button
              aria-label="Mở menu"
              onClick={() => setMobileNav(true)}
              className="text-zinc-400 lg:hidden"
            >
              <Menu size={19} />
            </button>
            <span className="hidden text-zinc-600 sm:inline">Workspace</span>
            <ChevronRight size={12} className="hidden text-zinc-700 sm:block" />
            <span className="text-zinc-300">{f.savedOnly ? 'Deal đã lưu' : 'Khám phá deal'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[.035] px-2.5 py-1 text-[9px] text-amber-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
              DEMO WORKSPACE
            </span>
            <button
              onClick={() => setHelpOpen(true)}
              aria-label="Trợ giúp"
              className="text-zinc-500"
            >
              <CircleHelp size={16} />
            </button>
            <div className="hidden h-5 w-px bg-white/10 sm:block" />
            <span className="hidden text-[10px] text-zinc-600 sm:block">
              Made for smarter shopping <span className="ml-1">✦</span>
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1520px] px-5 pb-8 pt-8 sm:px-8">
          <section className="mb-7 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] tracking-[.1em] text-emerald-400">
                <Zap size={12} />
                YOUR SMART SHOPPING COPILOT
              </div>
              <h1 className="text-[28px] font-semibold tracking-[-.035em] sm:text-[32px]">
                {f.savedOnly ? (
                  'Những deal bạn đã lưu.'
                ) : (
                  <>
                    Deal tốt thật. <span className="text-zinc-500">Không chỉ rẻ.</span>
                  </>
                )}
              </h1>
              <p className="mt-2 text-xs leading-6 text-zinc-500">
                So sánh giá, lọc đánh giá nhiễu và tìm lựa chọn đáng tiền trên 3 nền tảng.
              </p>
            </div>
            <Badge className="mt-3 hidden gap-2 border border-white/10 px-3 py-2 text-[10px] font-normal text-zinc-500 xl:inline-flex">
              <Sparkles size={13} className="text-emerald-400" />
              Powered by Pulse Engine<span className="text-zinc-700">v1.0</span>
            </Badge>
          </section>
          <SearchBar
            initialQuery={query}
            onSearch={(q) => {
              setQuery(q);
              f.setSavedOnly(false);
            }}
            loading={result.isFetching}
          />
          <div className="mb-6 flex items-center gap-2.5 overflow-x-auto whitespace-nowrap text-[10px]">
            <span className="text-zinc-600">Gợi ý tìm kiếm</span>
            {suggestions.map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  f.reset();
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/[.065] px-3 py-1.5 text-zinc-500 transition-colors hover:border-emerald-400/25 hover:text-zinc-200"
              >
                {i === 0 && <TrendingDown size={11} className="text-emerald-400" />}
                {s}
                <ArrowRight size={10} />
              </button>
            ))}
          </div>
          {result.isPending ? (
            <LoadingState />
          ) : result.isError ? (
            <Card className="p-12 text-center">
              <p role="alert" className="text-rose-300">
                {result.error.message}
              </p>
              <Button className="mt-5" onClick={() => result.refetch()}>
                Thử lại
              </Button>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-2 text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Tìm thấy{' '}
                  <strong className="font-medium text-zinc-200">{products.length} sản phẩm</strong>
                  <span className="text-zinc-700">/</span>
                  <span className="max-w-44 truncate sm:max-w-none">“{query}”</span>
                </span>
                <span className="hidden text-zinc-600 sm:inline">
                  {result.isFetching
                    ? 'Đang cập nhật...'
                    : `Phân tích trong ${result.data.meta.executionTimeMs}ms`}
                  <span className="mx-2 text-zinc-800">|</span>Dữ liệu mẫu
                </span>
              </div>
              {best && (
                <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
                  <CrownPick product={best} onAnalyze={setSelected} />
                  <Card className="flex flex-col p-5">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-400/10 text-cyan-300">
                        <Activity size={14} />
                      </span>
                      Đằng sau một deal tốt
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-zinc-500">
                      Giá thấp chưa đủ. Pulse đánh giá những điều thực sự quan trọng.
                    </p>
                    <div className="mt-6 space-y-4">
                      {[
                        {
                          label: 'Chất lượng thực tế',
                          value: 40,
                          color: 'bg-emerald-400',
                          text: 'text-emerald-300',
                        },
                        {
                          label: 'Độ tin cậy đánh giá',
                          value: 35,
                          color: 'bg-cyan-400',
                          text: 'text-cyan-300',
                        },
                        {
                          label: 'Mức giá cạnh tranh',
                          value: 25,
                          color: 'bg-violet-400',
                          text: 'text-violet-300',
                        },
                      ].map((s) => (
                        <div key={s.label}>
                          <div className="mb-2 flex justify-between text-[10px]">
                            <span className="text-zinc-400">{s.label}</span>
                            <span className={s.text}>{s.value}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/5">
                            <div
                              className={cn('h-1 rounded-full', s.color)}
                              style={{ width: `${s.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex gap-2 rounded-lg border border-amber-400/10 bg-amber-400/[.025] p-2.5 text-[10px] leading-5 text-zinc-500">
                      <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-300" />
                      <p>
                        Tỷ lệ chê &gt; 5%?
                        <br />
                        <span className="text-amber-200/75">Điểm tổng bị trừ ngay 35%.</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setHelpOpen(true)}
                      className="mt-auto flex items-center justify-between pt-5 text-[10px] text-zinc-400"
                    >
                      Khám phá thuật toán
                      <ArrowUpRightIcon />
                    </button>
                  </Card>
                </div>
              )}
              <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    Icon: Database,
                    title: 'SẢN PHẨM ĐÃ QUÉT',
                    value: String(result.data.meta.totalScanned).padStart(2, '0'),
                    detail: `từ ${Object.values(result.data.meta.platformDistribution).filter((n) => n > 0).length} sàn thương mại điện tử`,
                    color: 'text-cyan-300',
                    note: 'Dữ liệu demo',
                  },
                  {
                    Icon: ShieldCheck,
                    title: 'DEAL CẦN THẬN TRỌNG',
                    value: String(riskyCount).padStart(2, '0'),
                    detail: 'được phát hiện từ đánh giá tiêu cực',
                    color: 'text-amber-300',
                    note: 'Lọc nhiễu thông minh',
                  },
                  {
                    Icon: TrendingDown,
                    title: 'TIẾT KIỆM VỚI CROWN PICK',
                    value: money(potentialSaving),
                    detail: 'so với giá gốc của nhà bán hàng',
                    color: 'text-emerald-300',
                    note: best
                      ? `↓ ${Math.round((potentialSaving / (best.originalPrice || 1)) * 100)}% giá gốc`
                      : 'Chưa có sản phẩm',
                  },
                ].map(({ Icon, title, value, detail, color, note }) => (
                  <Card key={title} className="flex items-start gap-3.5 p-4">
                    <span
                      className={cn(
                        'mt-1 rounded-lg border border-white/5 bg-white/[.025] p-2',
                        color,
                      )}
                    >
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[9px] font-medium tracking-[.08em] text-zinc-500">
                        {title}
                      </h3>
                      <div className="my-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[22px] font-semibold tracking-tight">{value}</span>
                        <span className={cn('text-[9px]', color)}>{note}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600">{detail}</p>
                    </div>
                  </Card>
                ))}
              </div>
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-semibold tracking-tight">Bảng so sánh</h2>
                    <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] text-zinc-500">
                      {products.length}
                    </span>
                    <span className="ml-2 hidden text-[10px] text-zinc-600 sm:inline">
                      Xếp hạng theo giá trị, không theo quảng cáo.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mr-2 hidden items-center gap-1.5 text-[10px] text-zinc-500 md:flex">
                      <ListFilter size={12} />
                      Pulse Score: cao → thấp
                    </span>
                    <div className="flex rounded-lg border border-white/10 bg-[#121619] p-0.5">
                      {(
                        [
                          { view: 'table', Icon: Table2, label: 'Dạng bảng' },
                          { view: 'grid', Icon: Grid2X2, label: 'Dạng lưới' },
                        ] as const
                      ).map(({ view, Icon, label }) => (
                        <button
                          key={view}
                          onClick={() => f.setView(view)}
                          aria-label={label}
                          aria-pressed={f.view === view}
                          className={cn(
                            'rounded-md px-2.5 py-1.5',
                            f.view === view ? 'bg-white/[.08] text-zinc-200' : 'text-zinc-600',
                          )}
                        >
                          <Icon size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {products.length ? (
                  f.view === 'table' ? (
                    <ComparisonTable products={products} onAnalyze={setSelected} />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {products.map((p, index) => (
                        <ProductCard key={p.id} product={p} index={index} onAnalyze={setSelected} />
                      ))}
                    </div>
                  )
                ) : (
                  <Card className="flex flex-col items-center p-14 text-center">
                    <Search size={32} className="mb-5 text-zinc-600" />
                    <h3 className="font-medium">
                      {f.savedOnly
                        ? 'Chưa có deal đã lưu trong kết quả này'
                        : 'Không tìm thấy sản phẩm phù hợp'}
                    </h3>
                    <p className="mt-2 text-xs text-zinc-500">
                      Thử thay đổi từ khóa, mức giá hoặc số lượng đánh giá tối thiểu.
                    </p>
                    <Button variant="outline" className="mt-5" onClick={f.reset}>
                      Xóa bộ lọc
                    </Button>
                  </Card>
                )}
                <div className="mt-3 flex items-center justify-between gap-3 text-[9px] text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Info size={11} />
                    Bấm vào sản phẩm để xem phân tích đánh giá chi tiết.
                  </span>
                  <span className="hidden sm:block">
                    Hiển thị {products.length} / {result.data.items.length} kết quả đã phân tích
                  </span>
                </div>
              </section>
            </>
          )}
          <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] pt-5 text-[9px] text-zinc-600">
            <span className="flex items-center gap-1.5">
              <AudioLines size={13} />
              DealPulse VN<span className="mx-1 text-zinc-800">/</span>Mua thông minh. Chọn an tâm.
            </span>
            <span>Dữ liệu mô phỏng · Không thu thập dữ liệu trực tiếp từ các sàn.</span>
            <button onClick={() => setHelpOpen(true)} className="hover:text-zinc-300">
              Về Pulse Engine ↗
            </button>
          </footer>
        </main>
      </div>
      <ReviewBreakdownModal product={selected} onClose={() => setSelected(null)} />
      <Dialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Điểm Pulse được tính như thế nào?"
        description="Một công thức minh bạch. Không có vị trí trả phí."
      >
        <div className="mt-5 space-y-5 text-sm leading-7 text-zinc-400">
          <p>
            <strong className="text-emerald-300">35% độ tin cậy:</strong> Trung bình Bayesian với
            mức tiên nghiệm 4.7/5 và trọng số 50 đánh giá. Một sản phẩm 5 sao với 3 đánh giá không
            vượt qua 4.88 sao với 5,000 đánh giá.
          </p>
          <p>
            <strong className="text-emerald-300">40% chất lượng:</strong> Tách phàn nàn vận chuyển,
            đóng gói khỏi lỗi sản phẩm. Mẫu đánh giá không rõ nguyên nhân được xử lý thận trọng.
          </p>
          <p>
            <strong className="text-emerald-300">25% giá:</strong> Chuẩn hóa mức giá trong nhóm sản
            phẩm trước khi chấm điểm.
          </p>
          <p className="rounded-lg border border-amber-300/15 bg-amber-300/5 p-3 text-xs text-amber-200">
            Tỷ lệ 1–2 sao &gt; 5%: giảm 35% điểm tổng. Tỷ lệ lỗi nghiêm trọng &gt; 8%: luôn xếp loại
            AVOID.
          </p>
          <p className="text-xs">
            Đây là bản demo sử dụng dữ liệu mẫu, không phải trình thu thập dữ liệu trực tiếp. “Tới
            nơi bán” mở trang tìm kiếm chính thức của sàn. Nếu cấu hình OPENAI_API_KEY, phân tích
            sâu có thể dùng GPT-4o-mini; nếu không, hệ thống dùng phân tích cục bộ và ghi rõ nguồn.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ExternalLink size={12} />;
}
