'use client';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  TriangleAlert,
} from 'lucide-react';
import type { AnalyzedProduct } from '@/types/product';
import type { AnalysisResponse } from '@/types/review';
import { Dialog, Button, Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { ReviewBreakdown } from '@/components/comparison-table';
type Analysis = AnalysisResponse;
const fallbackLabels = {
  not_configured: 'Chưa cấu hình Ollama API key.',
  rate_limited: 'Đã đạt giới hạn gọi AI. Vui lòng thử lại sau.',
  provider_error: 'Không kết nối được Ollama hoặc model chưa khả dụng.',
  invalid_response: 'Ollama trả về dữ liệu không hợp lệ.',
  timeout: 'Ollama chưa phản hồi trong 30 giây.',
};
export function ReviewBreakdownModal({
  product,
  onClose,
}: {
  product: AnalyzedProduct | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const mutation = useMutation({
    mutationFn: async (p: AnalyzedProduct): Promise<Analysis> => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: p }),
      });
      if (!response.ok) throw new Error('Chưa thể phân tích. Vui lòng thử lại.');
      return response.json();
    },
  });
  const { mutate, reset } = mutation;
  useEffect(() => {
    setCopied(false);
    if (product) mutate(product);
    else reset();
  }, [product, mutate, reset]);
  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Phân tích sâu rủi ro"
      description={product?.title ?? 'Đánh giá sản phẩm'}
    >
      {mutation.isPending && (
        <div role="status" className="flex items-center gap-3 py-16 text-sm text-emerald-300">
          <LoaderCircle size={20} className="animate-spin" />
          Đang đối chiếu những đánh giá tiêu cực...
        </div>
      )}
      {mutation.isError && (
        <div className="py-8">
          <p role="alert" className="mb-4 text-rose-300">
            {mutation.error.message}
          </p>
          <Button onClick={() => product && mutate(product)}>Thử lại</Button>
        </div>
      )}
      {mutation.data && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-400/10 text-emerald-300">
              <Sparkles size={12} />
              {mutation.data.source === 'ai'
                ? 'Ollama Cloud · AI'
                : 'Phân tích cục bộ · Không dùng AI'}
            </Badge>
            <span className="text-[10px] text-zinc-500">Dữ liệu mẫu minh họa</span>
          </div>
          {mutation.data.source === 'local' && (
            <p role="status" className="mt-3 text-xs text-amber-300">
              {fallbackLabels[mutation.data.fallbackReason]} Đang hiển thị phân tích bằng quy tắc,
              không phải AI.
            </p>
          )}
          <h3
            className={cn(
              'mt-5 flex items-center gap-2 text-lg font-semibold',
              mutation.data.buyingVerdict === 'Né gấp'
                ? 'text-rose-300'
                : mutation.data.buyingVerdict === 'Cân nhắc kỹ'
                  ? 'text-amber-300'
                  : 'text-emerald-300',
            )}
          >
            <ShieldCheck size={21} />
            {mutation.data.buyingVerdict}
          </h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">{mutation.data.sentimentInsight}</p>
          <div className="my-5 rounded-xl border border-white/10 p-4">
            <h4 className="mb-3 text-xs font-semibold">Checklist trước khi chốt đơn</h4>
            {mutation.data.adviceForBuyer.map((advice, index) => (
              <p key={index} className="mt-3 flex gap-2 text-xs leading-5 text-zinc-400">
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                {advice}
              </p>
            ))}
          </div>
          {product && (
            <div className="overflow-hidden rounded-xl border border-white/5">
              <ReviewBreakdown product={product} />
            </div>
          )}
          <p className="mt-4 flex gap-2 text-[10px] leading-5 text-zinc-600">
            <TriangleAlert size={13} className="mt-1 shrink-0" />
            Phân tích dựa trên mẫu đánh giá, không phải cam kết chất lượng. Hãy kiểm tra nhà bán
            hàng trước khi mua.
          </p>
          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${mutation.data!.buyingVerdict}\n${mutation.data!.sentimentInsight}\n${mutation.data!.adviceForBuyer.join('\n')}`,
                  );
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Đã sao chép' : 'Sao chép phân tích'}
            </Button>
            {product && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-emerald-400 px-4 text-xs font-semibold text-zinc-950"
              >
                Tới nơi bán
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
