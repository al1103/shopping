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

export type AnalysisResponse = DeepAnalysis &
  (
    | { source: 'ai'; provider: 'ollama' }
    | {
        source: 'local';
        fallbackReason:
          'not_configured' | 'rate_limited' | 'provider_error' | 'invalid_response' | 'timeout';
      }
  );
