import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
export const metadata: Metadata = {
  title: 'DealPulse VN — Mua thông minh. Chọn an tâm.',
  description:
    'So sánh giá và phân tích đánh giá từ Shopee, Lazada và TikTok Shop. Tìm món hời thực sự, không chỉ giá rẻ.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
