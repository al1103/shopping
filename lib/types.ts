export type {
  AnalyzedProduct,
  NegativeReviewCategory,
  Platform,
  ProductVerdict,
  RatingBreakdown,
  ScrapedProduct,
} from '@/types/product';
export type { CategorizedReview, DeepAnalysis } from '@/types/review';

import type { AnalyzedProduct, Platform } from '@/types/product';

export type PlatformDistribution = Record<Platform, number>;

export type SearchResponse = {
  bestPick: AnalyzedProduct | null;
  items: AnalyzedProduct[];
  meta: {
    totalScanned: number;
    executionTimeMs: number;
    platformDistribution: PlatformDistribution;
  };
};
