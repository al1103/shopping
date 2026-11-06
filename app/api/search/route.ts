import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getMockCatalog } from '../../../lib/mock-data';
import { computeDealScore } from '../../../lib/scoring-engine';
import type { Platform } from '../../../types/product';

const platforms = ['Shopee', 'Lazada', 'TikTok Shop'] as const;
const querySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(160),
  minReviews: z.coerce.number().int().min(0).max(1_000_000).default(20),
  platform: z.enum(platforms).optional(),
});

function normalized(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CATEGORY_TERMS: Record<string, string[]> = {
  'bàn phím cơ': ['ban phim', 'keyboard', 'phim co'],
  keyboard: ['ban phim', 'keyboard', 'phim co'],
  'bàn phím': ['ban phim', 'keyboard', 'phim co'],
  'phím cơ': ['ban phim', 'keyboard', 'phim co'],
  'power bank': ['sac du phong', 'power bank'],
  'sạc dự phòng': ['sac du phong', 'power bank'],
  hoodie: ['hoodie', 'ao hoodie'],
  'áo hoodie': ['hoodie', 'ao hoodie'],
  mouse: ['chuot khong day', 'mouse'],
  chuột: ['chuot khong day', 'mouse'],
};

function matchesQuery(
  query: string,
  title: string,
  shopName: string,
  searchTerms: string[],
): boolean {
  const normalizedQuery = normalized(query);
  const productSearchable = normalized(`${title} ${shopName} ${searchTerms.join(' ')}`);
  const category = Object.entries(CATEGORY_TERMS)
    .sort(([a], [b]) => b.length - a.length)
    .find(([key]) => ` ${normalizedQuery} `.includes(` ${normalized(key)} `));
  let remainingQuery = normalizedQuery;
  if (category) {
    const [term, aliases] = category;
    if (!aliases.some((alias) => productSearchable.includes(normalized(alias)))) return false;
    remainingQuery = normalizedQuery.replace(normalized(term), '').trim();
    if (!remainingQuery) return true;
  }
  const tokens = remainingQuery.split(' ').filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => productSearchable.includes(token));
}

function parseGetRequest(request: Request) {
  const params = new URL(request.url).searchParams;
  return querySchema.safeParse({
    q: params.get('q') ?? '',
    minReviews: params.get('minReviews') ?? undefined,
    platform: params.get('platform') ?? undefined,
  });
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const parsed = parseGetRequest(request);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid search request' },
      { status: 400 },
    );
  }
  return search(parsed.data, startedAt);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid search request' },
      { status: 400 },
    );
  }
  return search(parsed.data, startedAt);
}

function search(input: z.infer<typeof querySchema>, startedAt: number) {
  try {
    const candidates = getMockCatalog().filter(({ product, searchTerms }) => {
      const platformMatches = !input.platform || product.platform === input.platform;
      return platformMatches && matchesQuery(input.q, product.title, product.shopName, searchTerms);
    });
    const platformDistribution: Record<Platform, number> = {
      Shopee: 0,
      Lazada: 0,
      'TikTok Shop': 0,
    };
    for (const { product } of candidates) platformDistribution[product.platform] += 1;

    const eligible = candidates
      .map(({ product }) => product)
      .filter((product) => product.reviewCount >= input.minReviews);
    const prices = eligible.map((product) => product.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const items = eligible
      .map((product) => computeDealScore(product, minPrice, maxPrice))
      .sort((left, right) => right.finalScore - left.finalScore);

    return NextResponse.json({
      bestPick: items[0] ?? null,
      items,
      meta: {
        totalScanned: candidates.length,
        executionTimeMs: Math.max(0, Date.now() - startedAt),
        platformDistribution,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to complete product search' }, { status: 500 });
  }
}
