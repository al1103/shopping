import { analyzeWithOllama, OllamaError } from '../../../lib/ollama';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  calculateNegativeRatio,
  categorizeReview,
  categorizeReviewsAndFilterNoise,
} from '../../../lib/scoring-engine';
import type { DeepAnalysis } from '../../../types/review';

const inputSchema = z.object({
  product: z.object({
    title: z.string().trim().min(1).max(240),
    price: z.number().finite().nonnegative(),
    ratingBreakdown: z.object({
      1: z.number().finite().nonnegative(),
      2: z.number().finite().nonnegative(),
      3: z.number().finite().nonnegative(),
      4: z.number().finite().nonnegative(),
      5: z.number().finite().nonnegative(),
    }),
    reviewCount: z.number().finite().nonnegative().optional(),
    negativeSampleReviews: z.array(z.string().max(1200)).max(30),
    finalScore: z.number().finite().min(0).max(100).optional(),
  }),
});

function localAnalysis(product: z.infer<typeof inputSchema>['product']): DeepAnalysis {
  const { criticalFlaws, noiseRatio } = categorizeReviewsAndFilterNoise(
    product.negativeSampleReviews,
  );
  const negativeRatio = calculateNegativeRatio(product.ratingBreakdown);
  const nonEmptyReviews = product.negativeSampleReviews.filter((review) => review.trim());
  const criticalSampleCount = nonEmptyReviews.filter((review) => {
    const category = categorizeReview(review);
    return category === 'PRODUCT_QUALITY' || category === 'SELLER_SERVICE';
  }).length;
  const criticalNegativeRatio = nonEmptyReviews.length
    ? (negativeRatio * criticalSampleCount) / nonEmptyReviews.length
    : negativeRatio;
  const reviewCount =
    product.reviewCount ??
    Object.values(product.ratingBreakdown).reduce((sum, count) => sum + count, 0);
  const buyingVerdict: DeepAnalysis['buyingVerdict'] =
    (product.finalScore !== undefined && product.finalScore < 50) || criticalNegativeRatio > 0.08
      ? 'Né gấp'
      : negativeRatio > 0.05 || criticalNegativeRatio > 0 || reviewCount < 20
        ? 'Cân nhắc kỹ'
        : 'Nên mua ngay';
  const sentimentInsight = criticalFlaws.length
    ? `Có ${criticalFlaws.length} mẫu phản hồi nêu vấn đề tiềm ẩn về sản phẩm hoặc dịch vụ; đây chỉ là mẫu đánh giá, không đủ để khẳng định tỷ lệ lỗi thực tế.`
    : noiseRatio > 0
      ? `Phản hồi mẫu chủ yếu đề cập vận chuyển (${Math.round(noiseRatio * 100)}%); chưa thấy mẫu phàn nàn rõ về lỗi sản phẩm.`
      : 'Mẫu đánh giá được cung cấp chưa nêu lỗi sản phẩm cụ thể; điều này không đảm bảo sản phẩm không có lỗi.';

  return {
    buyingVerdict,
    sentimentInsight,
    adviceForBuyer: [
      'Kiểm tra đúng phiên bản, phụ kiện và chính sách đổi trả trước khi thanh toán.',
      'Quay video mở hộp liên tục để lưu bằng chứng nếu sản phẩm lỗi hoặc thiếu phụ kiện.',
    ],
  };
}

// Per-instance guard; distributed deployments also need gateway/provider budgets.
const aiRequestTimes: number[] = [];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid analysis request' },
      { status: 400 },
    );
  }

  const product = parsed.data.product;
  if (!process.env.OLLAMA_API_KEY) {
    return NextResponse.json({
      ...localAnalysis(product),
      source: 'local' as const,
      fallbackReason: 'not_configured',
    });
  }

  const now = Date.now();
  while (aiRequestTimes.length && aiRequestTimes[0] <= now - 60_000) aiRequestTimes.shift();
  if (aiRequestTimes.length >= 10) {
    return NextResponse.json({
      ...localAnalysis(product),
      source: 'local' as const,
      fallbackReason: 'rate_limited',
    });
  }
  aiRequestTimes.push(now);

  try {
    const object = await analyzeWithOllama(
      {
        title: product.title,
        price: product.price,
        ratingBreakdown: product.ratingBreakdown,
        reviewCount: product.reviewCount,
        negativeSampleReviews: product.negativeSampleReviews,
      },
      process.env.OLLAMA_API_KEY,
    );
    return NextResponse.json({ ...object, source: 'ai' as const, provider: 'ollama' as const });
  } catch (error) {
    return NextResponse.json({
      ...localAnalysis(product),
      source: 'local' as const,
      fallbackReason: error instanceof OllamaError ? error.reason : 'provider_error',
    });
  }
}
