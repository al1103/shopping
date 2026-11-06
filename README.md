# DealPulse VN

A Vietnamese smart-shopping dashboard comparing **price, review reliability, and product sentiment** across Shopee, Lazada, and TikTok Shop. Built with Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Radix/shadcn-style primitives, Lucide, Framer Motion, TanStack Query, Zustand, and Zod.

## Run

```sh
npm ci
npm run dev
```

Open port 3000. `npm run build` creates the production build; `npm start` serves it. Stop the development server before building: both use `.next`.

```sh
npm test             # scoring and route tests
npm run typecheck    # strict TypeScript
npm run build        # production compilation
```

## Demo boundaries

This implementation uses a deterministic, realistic Vietnamese mock catalog, **not live scraping**. Keyboard, power-bank, hoodie, and everyday-product searches are supported. Unknown searches return an empty result. Marketplace actions open official platform search pages, not verified product listings. Prices, review quotes, stores, and ratings are illustrative; scoring is not a safety guarantee.

The mock catalog includes a cheap, defective TikTok product; a higher-priced Shopee Mall product with 3,000 reviews and logistics-only complaints; and a four-review Lazada listing excluded by the default minimum of 20 reviews.

## Ollama Cloud analysis

Create an API key at https://ollama.com/settings/keys and store it as **server-only** `OLLAMA_API_KEY` in the project environment or `.env.local`. Never paste it into chat, commit it, or prefix it with `NEXT_PUBLIC_`. Copy `.env.example` for configuration. `OLLAMA_MODEL` defaults to `gpt-oss:120b`; choose an available cloud model from https://ollama.com/api/tags. Restart the app after changing environment variables.

The server calls `https://ollama.com/api/chat` with Bearer authentication, no streaming, and a 30-second timeout. Ollama Cloud [does not currently support structured outputs](https://docs.ollama.com/capabilities/structured-outputs), so the prompt requests JSON and the response is independently validated with Zod. Malformed JSON, missing fields, provider errors, and timeouts fall back to clearly labeled **rules-based local analysis, not AI**. No unsupported `format`/JSON-schema flag is sent. Review samples leave the server only when a key is configured and deep analysis is requested; do not send sensitive data.

The modal labels successful calls `Ollama Cloud · AI` and shows the reason whenever a local fallback occurs. Responses include `source: "ai", provider: "ollama"` only after a validated provider response. Missing credentials return `fallbackReason: "not_configured"`.

Transport tests use mocked HTTP responses and **do not prove live model inference**. To verify live inference after configuring the key: open a product's deep-analysis dialog, confirm `Ollama Cloud · AI`, and inspect `/api/analyze` for `source: "ai"` and `provider: "ollama"`. A successful HTTP 200 with `source: "local"` is a fallback, not a successful AI test.

References: [Ollama Cloud API and authentication](https://docs.ollama.com/cloud).

## Structure

- `app/page.tsx`: responsive dashboard, navigation, filters, states, and view selection.
- `app/api/search/route.ts`: validated GET/POST mock aggregation and ranking.
- `app/api/analyze/route.ts`: structured, server-only AI/local critique.
- `components/`: command search, hero/product cards, expandable comparison matrix, and risk-analysis dialog.
- `components/ui/`: accessible composable UI primitives using Radix Dialog and Tooltip.
- `lib/scoring-engine.ts`: pure sentiment, Bayesian, price, and verdict functions.
- `lib/mock-data.ts`: category-aware mock catalog.
- `lib/store.ts`: shared client filters and session-only saved deals.
- `types/`: product, review, and analysis contracts; `lib/types.ts` re-exports shared contracts.

## API

`GET /api/search?q=bàn%20phím%20cơ&minReviews=20&platform=Shopee`

POST accepts the same fields as JSON. `q` is required; `minReviews` defaults to 20; platform is optional and must be `Shopee`, `Lazada`, or `TikTok Shop`. Returns `{ bestPick, items, meta: { totalScanned, executionTimeMs, platformDistribution } }`. Items are descending by `finalScore`; empty results use `bestPick: null`. Platform counts are taken before the minimum-review filter. The client price slider filters ranked results without recalculating their scores.

`POST /api/analyze` accepts `{ product: { title, price, ratingBreakdown, negativeSampleReviews, finalScore? } }`. Returns `{ buyingVerdict, sentimentInsight, adviceForBuyer, source }`, where `source` is `local` or `ai`. AI responses include `provider: "ollama"`; local responses include `fallbackReason`. Invalid inputs return 400.

## Scoring

- Raw negative ratio: `(1-star + 2-star) / all ratings`.
- Bayesian rating: `(rating × reviews + 4.7 × 50) / (reviews + 50)`.
- Estimated critical ratio: raw negative ratio adjusted by the non-logistics share of negative samples. This is a heuristic estimate, not a statistically representative measurement. Missing negative samples are treated conservatively.
- Price competitiveness: `(batch maximum − price) / (batch maximum − batch minimum)`; equal-price batches receive equal full price credit.
- Base score: `Bayesian/5 × 35 + (1 − critical ratio) × 40 + competitiveness × 25`.
- Raw negatives strictly above 5% multiply the entire score by 0.65.
- Verdict: `BEST_PICK` at score ≥85 and critical ratio ≤2%; otherwise `SOLID_BUY` ≥70; `RISKY` ≥50. Score <50 **or** critical ratio >8% always means `AVOID`.

Vietnamese review matching is deterministic and limited: it is not a general-purpose language model. Shipping/packaging complaints are noise; recognized product defects take precedence in mixed reviews. Saved products remain only for the current browser session and are displayed within the current search results.

### AI deployment guardrails

AI generation has a 30-second timeout, no retries, a 900-token generation cap, and a maximum of 10 provider requests per rolling minute **per server instance**; excess calls fall back to local analysis. This in-memory guard resets on restart and is not a distributed quota. Before exposing the key-enabled endpoint publicly, enforce authentication or shared gateway rate limits and configure a provider/project spending budget. Keep the key server-side; never prefix it with `NEXT_PUBLIC_`.
