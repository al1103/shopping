import type { NegativeReviewCategory } from './product';

export type CategorizedReview = {
  text: string;
  category: NegativeReviewCategory;
};

export type DeepAnalysis = {
  buyingVerdict: 'Nên mua ngay' | 'Cân nhắc kỹ' | 'Né gấp';
  sentimentInsight: string;
  adviceForBuyer: string[];
};
