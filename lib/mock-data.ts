import type { Platform, ScrapedProduct } from '@/types/product';

type MockProductSeed = {
  product: ScrapedProduct;
  category: 'tech' | 'clothing' | 'everyday';
  searchTerms: string[];
};

const POWER_BANK_IMAGE =
  'https://images.unsplash.com/photo-1609592424833-7b0c2c0bb82b?auto=format&fit=crop&w=900&q=85';
const HOODIE_IMAGE =
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85';
const BOTTLE_IMAGE =
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85';
const MOUSE_IMAGE =
  'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85';

function productUrl(platform: Platform, title: string): string {
  const keyword = encodeURIComponent(title);
  if (platform === 'Shopee') return `https://shopee.vn/search?keyword=${keyword}`;
  if (platform === 'Lazada') return `https://www.lazada.vn/catalog/?q=${keyword}`;
  return `https://www.tiktok.com/shop/search?q=${keyword}`;
}

function keyboard(
  id: string,
  platform: Platform,
  title: string,
  price: number,
  ratingAvg: number,
  reviewCount: number,
  counts: [number, number, number, number, number],
  options: {
    sold?: number;
    shop?: string;
    mall?: boolean;
    originalPrice?: number;
    reviews?: string[];
  } = {},
): ScrapedProduct {
  return {
    id,
    platform,
    title,
    price,
    originalPrice: options.originalPrice ?? Math.round((price * 1.18) / 1000) * 1000,
    currency: 'VND',
    ratingAvg,
    totalSold: options.sold ?? reviewCount * 4,
    reviewCount,
    ratingBreakdown: { 1: counts[0], 2: counts[1], 3: counts[2], 4: counts[3], 5: counts[4] },
    negativeSampleReviews: options.reviews ?? [],
    url: productUrl(platform, title),
    thumbnail:
      platform === 'TikTok Shop'
        ? '/products/keyboard-purple.svg'
        : platform === 'Lazada'
          ? '/products/keyboard-dark.svg'
          : '/products/keyboard.svg',
    shopName: options.shop ?? 'Góc Phím Việt',
    isOfficialMall: options.mall ?? false,
  };
}

function otherProduct(
  id: string,
  platform: Platform,
  title: string,
  price: number,
  ratingAvg: number,
  reviewCount: number,
  counts: [number, number, number, number, number],
  category: MockProductSeed['category'],
  image: string,
  reviews: string[],
  shopName: string,
  isOfficialMall = false,
): MockProductSeed {
  return {
    category,
    searchTerms: category === 'tech' ? ['tech', 'điện tử', 'gadget'] : [],
    product: {
      id,
      platform,
      title,
      price,
      originalPrice: Math.round((price * 1.2) / 1000) * 1000,
      currency: 'VND',
      ratingAvg,
      totalSold: reviewCount * 5,
      reviewCount,
      ratingBreakdown: { 1: counts[0], 2: counts[1], 3: counts[2], 4: counts[3], 5: counts[4] },
      negativeSampleReviews: reviews,
      url: productUrl(platform, title),
      thumbnail: image,
      shopName,
      isOfficialMall,
    },
  };
}

const keyboardSeeds: ScrapedProduct[] = [
  keyboard(
    'kb-shopee-mall-knob',
    'Shopee',
    'Bàn phím cơ núm xoay K87 Pro - switch red',
    1290000,
    4.9,
    3000,
    [8, 16, 26, 168, 2782],
    {
      sold: 8400,
      shop: 'KeyHub Official Store',
      mall: true,
      originalPrice: 1690000,
      reviews: [
        'Shipper J&T giao hơi lâu nhưng bàn phím rất đẹp.',
        'J&T giao trễ một ngày, sản phẩm hoạt động tốt.',
      ],
    },
  ),
  keyboard(
    'kb-tiktok-cheap-broken',
    'TikTok Shop',
    'Bàn phím cơ 87 phím RGB giá rẻ',
    389000,
    3.8,
    420,
    [58, 45, 70, 95, 152],
    {
      shop: 'Phụ Kiện Giá Tốt',
      reviews: [
        'Nhận hàng thì nút space bị hỏng.',
        'Dùng 2 ngày hỏng, phím chập chờn.',
        'Không giống mô tả, keycap trầy xước.',
      ],
    },
  ),
  keyboard(
    'kb-lazada-low-sample',
    'Lazada',
    'Bàn phím cơ mini 68 phím Bluetooth',
    449000,
    5,
    4,
    [0, 0, 0, 0, 4],
    { shop: 'Tech Corner', reviews: ['Đóng gói cẩn thận, mới nhận chưa dùng lâu.'] },
  ),
  keyboard(
    'kb-shopee-mall-tkl',
    'Shopee',
    'Bàn phím cơ TKL Akko 3087 v2',
    1590000,
    4.8,
    1840,
    [12, 18, 75, 320, 1415],
    { shop: 'Akko Vietnam Official', mall: true, reviews: ['Giao hơi lâu nhưng gõ rất ổn.'] },
  ),
  keyboard(
    'kb-lazada-wireless',
    'Lazada',
    'Bàn phím cơ không dây tri-mode K68',
    1200000,
    4.7,
    765,
    [9, 11, 39, 150, 556],
    { shop: 'Gear Station', reviews: ['Pin dùng được lâu, kết nối ổn định.'] },
  ),
  keyboard(
    'kb-tiktok-compact',
    'TikTok Shop',
    'Bàn phím cơ 60% gaming RGB',
    579000,
    4.5,
    382,
    [14, 17, 40, 102, 209],
    { shop: 'Meo Gear', reviews: ['Hộp móp do vận chuyển, bàn phím không ảnh hưởng.'] },
  ),
  keyboard(
    'kb-shopee-lowprofile',
    'Shopee',
    'Bàn phím cơ low-profile nhôm K75',
    1790000,
    4.8,
    930,
    [7, 10, 40, 200, 673],
    { shop: 'Bàn Phím Việt', reviews: ['Keycap hơi lỏng nhưng shop hỗ trợ nhanh.'] },
  ),
  keyboard(
    'kb-lazada-knob-budget',
    'Lazada',
    'Bàn phím cơ núm xoay K87 hot-swap',
    729000,
    4.6,
    510,
    [11, 15, 44, 130, 310],
    { shop: 'Hype Keyboard', reviews: ['Núm xoay dùng tốt, giao hàng nhanh.'] },
  ),
  keyboard(
    'kb-tiktok-magnetic',
    'TikTok Shop',
    'Bàn phím gaming magnetic switch HE60',
    2290000,
    4.4,
    145,
    [8, 7, 18, 35, 77],
    {
      shop: 'ProPlay Gear',
      reviews: [
        'Switch bị lỗi sau vài trận, một số phím không nhận.',
        'Phần mềm khó cài, shop trả lời chậm.',
      ],
    },
  ),
  keyboard(
    'kb-shopee-quiet',
    'Shopee',
    'Bàn phím cơ silent switch văn phòng S98',
    1250000,
    4.7,
    680,
    [6, 12, 38, 175, 449],
    { shop: 'Office Gear Mall', reviews: ['Gõ êm, đóng gói chắc chắn.'] },
  ),
  keyboard(
    'kb-lazada-keycaps',
    'Lazada',
    'Bàn phím cơ keycap PBT pastel 104 phím',
    849000,
    4.6,
    325,
    [8, 11, 25, 90, 191],
    { shop: 'Keycap House', reviews: ['Màu thực tế hơi khác ảnh nhưng phím đẹp.'] },
  ),
  keyboard(
    'kb-tiktok-foldable',
    'TikTok Shop',
    'Bàn phím cơ 75% gasket mount',
    1390000,
    4.7,
    268,
    [5, 8, 22, 70, 163],
    { shop: 'Switch Lab', reviews: ['Đứt chỉ trên túi đựng đi kèm, bàn phím ổn.'] },
  ),
];

const nonKeyboardSeeds: MockProductSeed[] = [
  otherProduct(
    'power-bank-20w',
    'Shopee',
    'Sạc dự phòng 20W 10000mAh chính hãng',
    459000,
    4.8,
    1250,
    [7, 12, 48, 250, 933],
    'tech',
    POWER_BANK_IMAGE,
    ['Pin chai sau vài tháng sử dụng.', 'Sạc nhanh, đúng công suất.'],
    'Anker Official Store',
    true,
  ),
  otherProduct(
    'hoodie-zip',
    'Lazada',
    'Áo hoodie zip form rộng unisex',
    329000,
    4.6,
    540,
    [8, 14, 35, 140, 343],
    'clothing',
    HOODIE_IMAGE,
    ['Vải dày đẹp, size đúng.', 'Màu hơi khác ảnh chụp.'],
    'Mặc Đẹp Mỗi Ngày',
  ),
  otherProduct(
    'steel-bottle',
    'TikTok Shop',
    'Bình giữ nhiệt inox 500ml',
    159000,
    4.5,
    320,
    [7, 11, 25, 80, 197],
    'everyday',
    BOTTLE_IMAGE,
    ['Nắp bị rò nước sau khi dùng.', 'Giao lâu nhưng bình giữ nhiệt tốt.'],
    'Nhà Của Tiện Ích',
  ),
  otherProduct(
    'wireless-mouse',
    'Shopee',
    'Chuột không dây silent Bluetooth 2.4G',
    219000,
    4.7,
    780,
    [6, 10, 34, 170, 560],
    'tech',
    MOUSE_IMAGE,
    ['Dùng 2 ngày hỏng nút cuộn.', 'Nhỏ gọn, kết nối ổn định.'],
    'Click Tech Mall',
    true,
  ),
  otherProduct(
    'cotton-tee',
    'TikTok Shop',
    'Áo thun cotton basic unisex',
    129000,
    4.4,
    245,
    [9, 12, 28, 62, 134],
    'clothing',
    HOODIE_IMAGE,
    ['Đứt chỉ ở tay áo sau lần giặt đầu.', 'Vải mềm, mặc thoải mái.'],
    'Tiệm Áo Nhà Mây',
  ),
  otherProduct(
    'lunch-box',
    'Lazada',
    'Hộp cơm giữ nhiệt 3 ngăn inox',
    289000,
    4.7,
    410,
    [4, 8, 20, 95, 283],
    'everyday',
    BOTTLE_IMAGE,
    ['Đóng gói kỹ, giữ nhiệt khá tốt.'],
    'Gia Dụng Xanh',
  ),
];

const mockCatalog: MockProductSeed[] = [
  ...keyboardSeeds.map((product) => ({
    product,
    category: 'tech' as const,
    searchTerms: ['bàn phím', 'ban phim', 'keyboard', 'phím cơ', 'phim co', 'gaming'],
  })),
  ...nonKeyboardSeeds,
];

export function getMockProducts(): ScrapedProduct[] {
  return mockCatalog.map(({ product }) => ({
    ...product,
    ratingBreakdown: { ...product.ratingBreakdown },
    negativeSampleReviews: [...product.negativeSampleReviews],
  }));
}

export function getMockCatalog(): MockProductSeed[] {
  return mockCatalog.map((entry) => ({
    ...entry,
    product: {
      ...entry.product,
      ratingBreakdown: { ...entry.product.ratingBreakdown },
      negativeSampleReviews: [...entry.product.negativeSampleReviews],
    },
    searchTerms: [...entry.searchTerms],
  }));
}
