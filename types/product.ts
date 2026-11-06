export type Platform = 'Shopee' | 'Lazada' | 'TikTok Shop';

export type RatingBreakdown = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type NegativeReviewCategory =
  'LOGISTICS' | 'PACKAGING' | 'PRODUCT_QUALITY' | 'SELLER_SERVICE';

export type ScrapedProduct = {
  id: string;
  platform: Platform;
  title: string;
  price: number;
  originalPrice: number;
  currency: string;
  ratingAvg: number;
  totalSold: number;
  reviewCount: number;
  ratingBreakdown: RatingBreakdown;
  negativeSampleReviews: string[];
  url: string;
  thumbnail: string;
  shopName: string;
  isOfficialMall: boolean;
};

export type ProductVerdict = 'BEST_PICK' | 'SOLID_BUY' | 'RISKY' | 'AVOID';

export type AnalyzedProduct = ScrapedProduct & {
  negativeRatio: number;
  bayesianScore: number;
  finalScore: number;
  criticalNegativeRatio: number;
  summarizedFlaws: string[];
  verdict: ProductVerdict;
};
