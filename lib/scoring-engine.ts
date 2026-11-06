import type {
  AnalyzedProduct,
  NegativeReviewCategory,
  RatingBreakdown,
  ScrapedProduct,
} from '@/types/product';

const LOGISTICS_TERMS = [
  'giao lau',
  'shipper',
  'cho hang',
  'giao hang cham',
  'van chuyen',
  'j t express',
  'j t',
  'don hang den cham',
];

const PACKAGING_TERMS = ['dong goi', 'vo hop', 'hop mop', 'boc so sai', 'thieu xop', 'bao bi hong'];
const QUALITY_TERMS = [
  'hang fake',
  'fake',
  'dung 2 ngay hong',
  'dut chi',
  'khong giong mo ta',
  'pin chai',
  'lua dao',
  'bi hong',
  'hang bi hong',
  'loi ky thuat',
  'phim bi loi',
  'switch bi loi',
  'switch loi',
  'switch failed',
  'switch is broken',
  'khong hoat dong',
  'chet nguon',
  'vo nut',
  'nut vo',
  'kem chat luong',
];

function normalizeVietnamese(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(text: string, terms: string[]): boolean {
  const searchable = ` ${text.replace(/[^a-z0-9]+/g, ' ').trim()} `;
  return terms.some((term) => searchable.includes(` ${term} `));
}

export function calculateNegativeRatio(breakdown: RatingBreakdown): number {
  const counts = [1, 2, 3, 4, 5].map((star) => {
    const value = breakdown[star as keyof RatingBreakdown];
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  });
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  return (counts[0] + counts[1]) / total;
}

export function computeBayesianRating(
  ratingAvg: number,
  reviewCount: number,
  globalPriorRating = 4.7,
  globalPriorWeight = 50,
): number {
  const prior = Number.isFinite(globalPriorRating)
    ? Math.min(5, Math.max(0, globalPriorRating))
    : 4.7;
  const weight = Number.isFinite(globalPriorWeight) ? Math.max(0, globalPriorWeight) : 50;
  const count = Number.isFinite(reviewCount) ? Math.max(0, reviewCount) : 0;
  const rating = Number.isFinite(ratingAvg) ? Math.min(5, Math.max(0, ratingAvg)) : prior;
  const denominator = count + weight;
  if (denominator === 0) return prior;
  return (rating * count + prior * weight) / denominator;
}

export function categorizeReview(text: string): NegativeReviewCategory {
  const normalized = normalizeVietnamese(text);
  if (containsAny(normalized, QUALITY_TERMS)) {
    return 'PRODUCT_QUALITY';
  }
  if (containsAny(normalized, PACKAGING_TERMS)) return 'PACKAGING';
  if (containsAny(normalized, LOGISTICS_TERMS)) return 'LOGISTICS';
  return 'SELLER_SERVICE';
}

export function categorizeReviewsAndFilterNoise(reviews: string[]): {
  criticalFlaws: string[];
  noiseRatio: number;
} {
  const usefulReviews = reviews.filter((review) => review.trim().length > 0);
  if (usefulReviews.length === 0) return { criticalFlaws: [], noiseRatio: 0 };

  const noiseReviews = usefulReviews.filter((review) => {
    const category = categorizeReview(review);
    return category === 'LOGISTICS' || category === 'PACKAGING';
  });
  const criticalFlaws = usefulReviews.filter((review) => {
    const category = categorizeReview(review);
    return category === 'PRODUCT_QUALITY' || category === 'SELLER_SERVICE';
  });

  return {
    criticalFlaws: [...new Set(criticalFlaws.map((review) => review.trim()))],
    noiseRatio: noiseReviews.length / usefulReviews.length,
  };
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function priceCompetitiveness(price: number, minPrice: number, maxPrice: number): number {
  const min = safeCount(minPrice);
  const max = Math.max(min, safeCount(maxPrice));
  const normalizedPrice = safeCount(price);
  if (max === min) return 1;
  return Math.min(1, Math.max(0, (max - normalizedPrice) / (max - min)));
}

export function computeDealScore(
  product: ScrapedProduct,
  minPrice: number,
  maxPrice: number,
): AnalyzedProduct {
  const negativeRatio = calculateNegativeRatio(product.ratingBreakdown);
  const { criticalFlaws } = categorizeReviewsAndFilterNoise(product.negativeSampleReviews);
  const nonEmptySamples = product.negativeSampleReviews.filter((review) => review.trim()).length;
  const criticalSampleCount = product.negativeSampleReviews.filter((review) => {
    if (!review.trim()) return false;
    const category = categorizeReview(review);
    return category === 'PRODUCT_QUALITY' || category === 'SELLER_SERVICE';
  }).length;
  const criticalNegativeRatio =
    nonEmptySamples > 0
      ? Math.min(1, negativeRatio * (criticalSampleCount / nonEmptySamples))
      : negativeRatio;
  const bayesianScore = computeBayesianRating(product.ratingAvg, product.reviewCount);
  const priceScore = priceCompetitiveness(product.price, minPrice, maxPrice);

  let finalScore = (bayesianScore / 5) * 35 + (1 - criticalNegativeRatio) * 40 + priceScore * 25;
  if (negativeRatio > 0.05) finalScore *= 0.65;
  finalScore = Math.min(100, Math.max(0, finalScore));

  let verdict: AnalyzedProduct['verdict'];
  if (finalScore < 50 || criticalNegativeRatio > 0.08) verdict = 'AVOID';
  else if (finalScore >= 85 && criticalNegativeRatio <= 0.02) verdict = 'BEST_PICK';
  else if (finalScore >= 70) verdict = 'SOLID_BUY';
  else verdict = 'RISKY';

  return {
    ...product,
    negativeRatio,
    bayesianScore,
    finalScore,
    criticalNegativeRatio,
    summarizedFlaws: criticalFlaws.slice(0, 4),
    verdict,
  };
}
