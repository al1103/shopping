import { describe, expect, it } from 'vitest';
import { GET as searchGet } from '../app/api/search/route';
import { POST as analyzePost } from '../app/api/analyze/route';
import {
  calculateNegativeRatio,
  categorizeReview,
  categorizeReviewsAndFilterNoise,
  computeBayesianRating,
  computeDealScore,
} from './scoring-engine';
import type { RatingBreakdown, ScrapedProduct } from '@/types/product';

const neutralBreakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 2, 4: 20, 5: 78 };

function makeProduct(overrides: Partial<ScrapedProduct> = {}): ScrapedProduct {
  return {
    id: 'test',
    platform: 'Shopee',
    title: 'Test product',
    price: 100,
    originalPrice: 120,
    currency: 'VND',
    ratingAvg: 4.8,
    totalSold: 100,
    reviewCount: 100,
    ratingBreakdown: neutralBreakdown,
    negativeSampleReviews: [],
    url: 'https://shopee.vn/search?keyword=test',
    thumbnail: '/products/test.svg',
    shopName: 'Test shop',
    isOfficialMall: false,
    ...overrides,
  };
}

describe('scoring engine', () => {
  it('calculates negative ratio from one- and two-star counts', () => {
    expect(calculateNegativeRatio({ 1: 10, 2: 5, 3: 15, 4: 20, 5: 50 })).toBe(0.15);
    expect(calculateNegativeRatio({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })).toBe(0);
    expect(calculateNegativeRatio({ 1: Number.NaN, 2: -2, 3: 0, 4: 0, 5: 0 })).toBe(0);
  });

  it('penalizes low review counts with the global Bayesian prior', () => {
    expect(computeBayesianRating(5, 3)).toBeLessThan(computeBayesianRating(4.88, 5000));
    expect(computeBayesianRating(3.5, 0)).toBe(4.7);
    expect(computeBayesianRating(4.5, 10, 4.2, 0)).toBe(4.5);
  });

  it('separates Vietnamese delivery noise from product flaws', () => {
    const result = categorizeReviewsAndFilterNoise([
      'J&T giao hàng lâu nhưng hàng vẫn tốt',
      'Dùng 2 ngày hỏng, không giống mô tả',
      'Hộp móp do shipper',
      ' ',
    ]);
    expect(result.noiseRatio).toBeCloseTo(2 / 3);
    expect(result.criticalFlaws).toEqual(['Dùng 2 ngày hỏng, không giống mô tả']);
    expect(categorizeReviewsAndFilterNoise([])).toEqual({ criticalFlaws: [], noiseRatio: 0 });
  });

  it('treats packaging complaints as noise and recognizes switch failures', () => {
    expect(categorizeReview('Hộp móp, bọc sơ sài')).toBe('PACKAGING');
    expect(categorizeReview('Bọc sơ sài, hàng đến vẫn nguyên vẹn')).toBe('PACKAGING');
    expect(categorizeReview('Switch bị lỗi sau vài trận')).toBe('PRODUCT_QUALITY');
    expect(categorizeReview('Magnetic switch failed after a few games')).toBe('PRODUCT_QUALITY');
    expect(
      categorizeReviewsAndFilterNoise(['Hộp móp', 'Bọc sơ sài', 'Switch bị lỗi sau vài trận']),
    ).toEqual({
      criticalFlaws: ['Switch bị lỗi sau vài trận'],
      noiseRatio: 2 / 3,
    });
  });

  it('treats mixed reviews and unknown seller complaints conservatively', () => {
    const result = categorizeReviewsAndFilterNoise([
      'J&T giao lâu',
      'Hộp móp',
      'Giao lâu, switch bị lỗi',
      'Shop không phản hồi tin nhắn',
    ]);
    expect(result.noiseRatio).toBe(0.5);
    expect(result.criticalFlaws).toEqual([
      'Giao lâu, switch bị lỗi',
      'Shop không phản hồi tin nhắn',
    ]);
  });

  it('applies the hard raw-negative penalty and avoid threshold', () => {
    const product = makeProduct({
      reviewCount: 100,
      ratingAvg: 4.6,
      ratingBreakdown: { 1: 7, 2: 4, 3: 9, 4: 25, 5: 55 },
      negativeSampleReviews: ['Hàng fake, dùng 2 ngày hỏng'],
    });
    const scored = computeDealScore(product, 100, 100);
    const unpenalizedProduct = makeProduct({
      ...product,
      ratingBreakdown: { 1: 0, 2: 0, 3: 9, 4: 25, 5: 66 },
      negativeSampleReviews: [],
    });
    const unpenalized = computeDealScore(unpenalizedProduct, 100, 100);
    expect(scored.negativeRatio).toBeGreaterThan(0.05);
    expect(scored.finalScore).toBeLessThan(unpenalized.finalScore);
    expect(scored.verdict).toBe('AVOID');
  });

  it('applies the raw-negative penalty only when the ratio is strictly greater than 5%', () => {
    const atBoundary = computeDealScore(
      makeProduct({
        ratingAvg: 5,
        reviewCount: 1000,
        ratingBreakdown: { 1: 5, 2: 0, 3: 0, 4: 0, 5: 95 },
        negativeSampleReviews: ['J&T giao lâu'],
      }),
      100,
      100,
    );
    const aboveBoundary = computeDealScore(
      makeProduct({
        ratingAvg: 5,
        reviewCount: 1000,
        ratingBreakdown: { 1: 6, 2: 0, 3: 0, 4: 0, 5: 94 },
        negativeSampleReviews: ['J&T giao lâu'],
      }),
      100,
      100,
    );

    expect(atBoundary.negativeRatio).toBe(0.05);
    expect(aboveBoundary.negativeRatio).toBe(0.06);
    expect(aboveBoundary.finalScore).toBeCloseTo(atBoundary.finalScore * 0.65);
  });

  it('counts repeated critical samples individually when computing the critical ratio', () => {
    const scored = computeDealScore(
      makeProduct({
        ratingAvg: 5,
        reviewCount: 1000,
        ratingBreakdown: { 1: 10, 2: 0, 3: 0, 4: 0, 5: 90 },
        negativeSampleReviews: ['Switch bị lỗi', 'Switch bị lỗi', 'J&T giao lâu'],
      }),
      100,
      100,
    );

    expect(scored.criticalNegativeRatio).toBeCloseTo(0.1 * (2 / 3));
    expect(scored.summarizedFlaws).toEqual(['Switch bị lỗi']);
  });

  it('does not count packaging-only samples as critical product flaws', () => {
    const scored = computeDealScore(
      makeProduct({
        ratingAvg: 4.8,
        reviewCount: 500,
        ratingBreakdown: { 1: 10, 2: 0, 3: 0, 4: 50, 5: 440 },
        negativeSampleReviews: ['Hộp móp', 'Bọc sơ sài'],
      }),
      100,
      100,
    );

    expect(scored.criticalNegativeRatio).toBe(0);
    expect(scored.summarizedFlaws).toEqual([]);
  });

  it('uses a strict greater-than 8% critical ratio for the AVOID override', () => {
    const atBoundary = computeDealScore(
      makeProduct({
        ratingAvg: 5,
        reviewCount: 1000,
        ratingBreakdown: { 1: 8, 2: 0, 3: 0, 4: 0, 5: 92 },
        negativeSampleReviews: ['Switch bị lỗi'],
      }),
      100,
      100,
    );
    const aboveBoundary = computeDealScore(
      makeProduct({
        ratingAvg: 5,
        reviewCount: 1000,
        ratingBreakdown: { 1: 9, 2: 0, 3: 0, 4: 0, 5: 91 },
        negativeSampleReviews: ['Switch bị lỗi'],
      }),
      100,
      100,
    );

    expect(atBoundary.criticalNegativeRatio).toBe(0.08);
    expect(atBoundary.verdict).not.toBe('AVOID');
    expect(aboveBoundary.criticalNegativeRatio).toBe(0.09);
    expect(aboveBoundary.finalScore).toBeGreaterThan(50);
    expect(aboveBoundary.verdict).toBe('AVOID');
  });

  it('handles degenerate price ranges and empty review samples', () => {
    const scored = computeDealScore(makeProduct({ reviewCount: 0 }), 0, 0);
    expect(scored.finalScore).toBeGreaterThan(0);
    expect(scored.criticalNegativeRatio).toBe(0);
    expect(scored.summarizedFlaws).toEqual([]);
  });

  it('keeps scoring finite for non-finite ratings and price bounds', () => {
    const scored = computeDealScore(
      makeProduct({
        price: Number.NaN,
        ratingAvg: Number.NaN,
        reviewCount: Number.NaN,
        ratingBreakdown: { 1: Number.NaN, 2: -1, 3: 0, 4: 0, 5: 0 },
        negativeSampleReviews: [''],
      }),
      Number.NaN,
      Number.POSITIVE_INFINITY,
    );
    expect(scored.negativeRatio).toBe(0);
    expect(scored.criticalNegativeRatio).toBe(0);
    expect(scored.bayesianScore).toBe(4.7);
    expect(Number.isFinite(scored.finalScore)).toBe(true);
  });

  it('searches the keyboard catalog and excludes the four-review item by default', async () => {
    const response = await searchGet(
      new Request('http://localhost/api/search?q=b%C3%A0n%20ph%C3%ADm'),
    );
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.meta.totalScanned).toBe(12);
    expect(result.items).toHaveLength(11);
    expect(result.items[0].id).toBe('kb-shopee-mall-knob');
    expect(result.bestPick.id).toBe(result.items[0].id);
    expect(result.meta.platformDistribution).toEqual({ Shopee: 4, Lazada: 4, 'TikTok Shop': 4 });
    expect(result.meta.executionTimeMs).toEqual(expect.any(Number));
    expect(
      result.items.every((item: ScrapedProduct & { thumbnail: string }) =>
        item.thumbnail.startsWith('/products/keyboard'),
      ),
    ).toBe(true);
    const magnetic = result.items.find((item: { id: string }) => item.id === 'kb-tiktok-magnetic');
    expect(magnetic.summarizedFlaws).toContain(
      'Switch bị lỗi sau vài trận, một số phím không nhận.',
    );
  });

  it('preserves specific qualifiers after expanding category aliases', async () => {
    const response = await searchGet(new Request('http://localhost/api/search?q=keyboard%20K87'));
    const result = await response.json();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item: ScrapedProduct) => item.title.includes('K87'))).toBe(true);
    const empty = await searchGet(
      new Request('http://localhost/api/search?q=keyboard%20nonexistent-model'),
    );
    expect((await empty.json()).items).toEqual([]);
  });

  it('rejects empty searches and returns labeled local analysis without an API key', async () => {
    const emptySearch = await searchGet(new Request('http://localhost/api/search?q='));
    expect(emptySearch.status).toBe(400);

    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const response = await analyzePost(
        new Request('http://localhost/api/analyze', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            product: {
              title: 'Bàn phím cơ K87',
              price: 500000,
              ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 18 },
              negativeSampleReviews: ['J&T giao hàng lâu nhưng sản phẩm tốt.'],
            },
          }),
        }),
      );
      const result = await response.json();
      expect(response.status).toBe(200);
      expect(result.source).toBe('local');
      expect(result.buyingVerdict).toBe('Nên mua ngay');
      expect(result.sentimentInsight).toContain('vận chuyển');
      expect(result.adviceForBuyer.length).toBeGreaterThan(0);
    } finally {
      if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it('scales local deep-analysis verdicts to review ratios and flags low sample counts', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const analyze = (product: Record<string, unknown>) =>
      analyzePost(
        new Request('http://localhost/api/analyze', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            product: {
              title: 'Test keyboard',
              price: 500000,
              ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              negativeSampleReviews: [],
              ...product,
            },
          }),
        }),
      );

    try {
      const isolatedIssueResponse = await analyze({
        ratingBreakdown: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 2999 },
        reviewCount: 3000,
        negativeSampleReviews: ['Switch bị lỗi'],
      });
      const isolatedIssue = await isolatedIssueResponse.json();
      expect(isolatedIssue.buyingVerdict).toBe('Cân nhắc kỹ');
      expect(isolatedIssue.sentimentInsight).toContain('không đủ để khẳng định');
      expect(isolatedIssue.sentimentInsight).not.toMatch(
        /98% safe|an toàn tuyệt đối|đảm bảo an toàn/i,
      );

      const lowSampleResponse = await analyze({
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 2 },
        reviewCount: 4,
      });
      expect((await lowSampleResponse.json()).buyingVerdict).toBe('Cân nhắc kỹ');

      const highCriticalResponse = await analyze({
        ratingBreakdown: { 1: 9, 2: 0, 3: 0, 4: 0, 5: 91 },
        reviewCount: 100,
        negativeSampleReviews: ['Switch bị lỗi'],
      });
      expect((await highCriticalResponse.json()).buyingVerdict).toBe('Né gấp');
    } finally {
      if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = originalKey;
    }
  });
});
