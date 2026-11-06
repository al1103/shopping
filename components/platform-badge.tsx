import { ShoppingBag, Music2 } from 'lucide-react';
import type { Platform } from '@/types/product';
import { cn } from '@/lib/utils';
const styles = {
  Shopee: 'text-orange-400 bg-orange-500/10',
  Lazada: 'text-violet-400 bg-violet-500/10',
  'TikTok Shop': 'text-cyan-300 bg-cyan-500/10',
};
export function PlatformBadge({
  platform,
  small = false,
}: {
  platform: Platform;
  small?: boolean;
}) {
  const Icon = platform === 'TikTok Shop' ? Music2 : ShoppingBag;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium',
        styles[platform],
      )}
    >
      <Icon size={small ? 11 : 13} />
      {platform}
    </span>
  );
}
