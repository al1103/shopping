import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeWithOllama } from './ollama';
import { POST } from '../app/api/analyze/route';
const product = {
  title: 'Bàn phím cơ',
  price: 500000,
  ratingBreakdown: { 1: 2, 2: 0, 3: 0, 4: 8, 5: 90 },
  negativeSampleReviews: ['Shipper giao lâu, bàn phím tốt.'],
};
const analysis = {
  buyingVerdict: 'Cân nhắc kỹ',
  sentimentInsight: 'Mẫu phản hồi nói về giao hàng chậm, chưa chứng minh lỗi sản phẩm.',
  adviceForBuyer: ['Quay video mở hộp.'],
};
function success(content = JSON.stringify(analysis)) {
  return Response.json({ done: true, message: { role: 'assistant', content } });
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('Ollama Cloud transport (mocked HTTP, not live inference)', () => {
  it('uses authenticated server-side native chat without unsupported structured-output flags', async () => {
    const fetchMock = vi.fn().mockResolvedValue(success());
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('OLLAMA_MODEL', 'test-model');
    expect(await analyzeWithOllama(product, 'test-key')).toEqual(analysis);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://ollama.com/api/chat');
    expect(request.headers.Authorization).toBe('Bearer test-key');
    expect(request.cache).toBe('no-store');
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({ model: 'test-model', stream: false });
    expect(body).not.toHaveProperty('format');
    expect(body).not.toHaveProperty('think');
    expect(JSON.parse(body.messages[1].content)).toEqual(product);
  });
  it('accepts fenced JSON but validates all structured fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(success('```json\n' + JSON.stringify(analysis) + '\n```')),
    );
    expect(await analyzeWithOllama(product, 'test-key')).toEqual(analysis);
  });
  it.each([
    'not JSON',
    '{"buyingVerdict":"guaranteed safe"}',
    JSON.stringify({ ...analysis, adviceForBuyer: [] }),
  ])('rejects invalid model output: %s', async (content) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(success(content)));
    await expect(analyzeWithOllama(product, 'test-key')).rejects.toMatchObject({
      reason: 'invalid_response',
    });
  });
  it('rejects incomplete generations', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ done: false, message: { content: JSON.stringify(analysis) } }),
        ),
    );
    await expect(analyzeWithOllama(product, 'test-key')).rejects.toMatchObject({
      reason: 'invalid_response',
    });
  });
  it.each([401, 429, 500])('handles provider HTTP %s without leaking errors', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('private provider error', { status })),
    );
    await expect(analyzeWithOllama(product, 'test-key')).rejects.toMatchObject({
      reason: 'provider_error',
    });
  });
  it('handles timeouts and network errors', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'))
      .mockRejectedValueOnce(new Error('network'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(analyzeWithOllama(product, 'test-key')).rejects.toMatchObject({
      reason: 'timeout',
    });
    await expect(analyzeWithOllama(product, 'test-key')).rejects.toMatchObject({
      reason: 'provider_error',
    });
  });
  it('labels route responses honestly and falls back when provider output is invalid', async () => {
    vi.stubEnv('OLLAMA_API_KEY', 'test-key');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(success('oops'));
    vi.stubGlobal('fetch', fetchMock);
    const request = () =>
      new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ product }),
      });
    expect(await (await POST(request())).json()).toMatchObject({
      ...analysis,
      source: 'ai',
      provider: 'ollama',
    });
    const fallback = await (await POST(request())).json();
    expect(fallback).toMatchObject({ source: 'local', fallbackReason: 'invalid_response' });
    expect(JSON.stringify(fallback)).not.toContain('test-key');
  });
  it('never calls a provider without a key', async () => {
    vi.stubEnv('OLLAMA_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(
      new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ product }),
      }),
    );
    expect(await response.json()).toMatchObject({
      source: 'local',
      fallbackReason: 'not_configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
