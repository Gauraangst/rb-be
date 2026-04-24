import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const deepCopy = (value) => JSON.parse(JSON.stringify(value));

const imageAliases = {
  '/images/products/kurti-1.jpg': '/images/products/kurti-1.png',
  '/images/products/kurti-2.jpg': '/images/products/kurti-2.png',
  '/images/products/kurti-3.jpg': '/images/products/kurti-3.png',
  '/images/products/kurti-4.jpg': '/images/products/kurti-4.png',
  '/images/products/kurti-5.jpg': '/images/products/kurti-3.png',
  '/images/products/kurti-6.jpg': '/images/products/kurti-4.png',
  '/images/products/kurti-7.jpg': '/images/products/kurti-2.png',
  '/images/products/kurti-8.jpg': '/images/products/kurti-1.png',
  '/images/products/jewel-1.jpg': '/images/products/jewel-1.png',
  '/images/products/jewel-2.jpg': '/images/products/jewel-2.png',
  '/images/products/jewel-3.jpg': '/images/products/jewel-1.png',
  '/images/products/jewel-4.jpg': '/images/products/jewel-2.png',
  '/images/products/kurti-5.png': '/images/products/kurti-3.png',
  '/images/products/kurti-6.png': '/images/products/kurti-4.png',
  '/images/products/kurti-7.png': '/images/products/kurti-2.png',
  '/images/products/kurti-8.png': '/images/products/kurti-1.png',
  '/images/products/jewel-3.png': '/images/products/jewel-1.png',
  '/images/products/jewel-4.png': '/images/products/jewel-2.png',
};

export const normalizeImagePath = (imagePath = '') => {
  if (!imagePath) {
    return '/images/products/kurti-1.png';
  }

  if (imageAliases[imagePath]) {
    return imageAliases[imagePath];
  }

  if (/^\/images\/products\/.+\.jpg$/i.test(imagePath)) {
    const pngPath = imagePath.replace(/\.jpg$/i, '.png');
    return imageAliases[pngPath] || pngPath;
  }

  return imagePath;
};

export const normalizeProductRecord = (product) => ({
  ...deepCopy(product),
  images: (product.images || []).map(normalizeImagePath),
});

const initialDemoProducts = [
  {
    _id: 'demo-product-1',
    name: 'Maharani Silk Anarkali Kurti',
    slug: 'maharani-silk-anarkali-kurti',
    description:
      'Exquisite silk anarkali kurti with intricate zari work and mirror embellishments. Perfect for festive occasions and celebrations.',
    price: 3999,
    originalPrice: 5999,
    category: 'festive-kurtis',
    images: ['/images/products/kurti-1.png'],
    colors: [
      { name: 'Maroon', hex: '#8B1A2B' },
      { name: 'Navy', hex: '#1B2A4A' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    material: 'Pure Silk',
    isBestseller: true,
    isFeatured: true,
    isNewArrival: false,
    stock: 25,
    rating: 4.8,
    reviewCount: 124,
    tags: ['festive', 'silk', 'anarkali', 'wedding'],
    createdAt: '2025-01-10T10:00:00.000Z',
  },
  {
    _id: 'demo-product-2',
    name: 'Chanderi Embroidered Kurti Set',
    slug: 'chanderi-embroidered-kurti-set',
    description:
      'Handcrafted Chanderi cotton kurti set with delicate thread embroidery. Comes with matching dupatta and palazzo.',
    price: 2799,
    originalPrice: 3999,
    category: 'festive-kurtis',
    images: ['/images/products/kurti-2.png'],
    colors: [
      { name: 'Blush Pink', hex: '#F5E6E0' },
      { name: 'Ivory', hex: '#FAF8F5' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    material: 'Chanderi Cotton',
    isBestseller: true,
    isFeatured: true,
    isNewArrival: true,
    stock: 30,
    rating: 4.6,
    reviewCount: 89,
    tags: ['festive', 'chanderi', 'embroidered', 'set'],
    createdAt: '2025-01-18T10:00:00.000Z',
  },
  {
    _id: 'demo-product-3',
    name: 'Banarasi Brocade Kurti',
    slug: 'banarasi-brocade-kurti',
    description:
      'Luxurious Banarasi brocade kurti with traditional motifs woven in gold thread. A timeless festive essential.',
    price: 4599,
    originalPrice: 6499,
    category: 'festive-kurtis',
    images: ['/images/products/kurti-3.png'],
    colors: [
      { name: 'Gold', hex: '#C9A96E' },
      { name: 'Red', hex: '#C41E3A' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    material: 'Banarasi Brocade',
    isBestseller: false,
    isFeatured: true,
    isNewArrival: false,
    stock: 15,
    rating: 4.9,
    reviewCount: 67,
    tags: ['festive', 'banarasi', 'brocade', 'traditional'],
    createdAt: '2024-12-20T10:00:00.000Z',
  },
  {
    _id: 'demo-product-4',
    name: 'Lucknowi Chikankari Kurti',
    slug: 'lucknowi-chikankari-kurti',
    description:
      'Elegant hand-embroidered Lucknowi chikankari kurti in pure georgette. Features intricate shadow work and mukaish highlights.',
    price: 3499,
    originalPrice: 4999,
    category: 'festive-kurtis',
    images: ['/images/products/kurti-4.png'],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Peach', hex: '#FFDAB9' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    material: 'Pure Georgette',
    isBestseller: true,
    isFeatured: false,
    isNewArrival: false,
    stock: 20,
    rating: 4.7,
    reviewCount: 156,
    tags: ['festive', 'chikankari', 'lucknowi', 'georgette'],
    createdAt: '2024-11-15T10:00:00.000Z',
  },
  {
    _id: 'demo-product-5',
    name: 'Cotton Printed A-Line Kurti',
    slug: 'cotton-printed-aline-kurti',
    description:
      'Comfortable cotton A-line kurti with vibrant block prints. Perfect for daily wear with effortless style.',
    price: 1299,
    originalPrice: 1799,
    category: 'everyday-wear',
    images: ['/images/products/kurti-3.png'],
    colors: [
      { name: 'Teal', hex: '#008080' },
      { name: 'Mustard', hex: '#DAA520' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    material: 'Pure Cotton',
    isBestseller: true,
    isFeatured: true,
    isNewArrival: false,
    stock: 50,
    rating: 4.5,
    reviewCount: 234,
    tags: ['everyday', 'cotton', 'printed', 'casual'],
    createdAt: '2025-02-02T10:00:00.000Z',
  },
  {
    _id: 'demo-product-6',
    name: 'Linen Straight Kurti',
    slug: 'linen-straight-kurti',
    description:
      'Minimal and chic linen straight kurti. Breathable fabric with a relaxed fit for all-day comfort.',
    price: 1599,
    originalPrice: 2199,
    category: 'everyday-wear',
    images: ['/images/products/kurti-4.png'],
    colors: [
      { name: 'Sage', hex: '#9CAF88' },
      { name: 'Beige', hex: '#E8DDD3' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    material: 'Premium Linen',
    isBestseller: true,
    isFeatured: false,
    isNewArrival: true,
    stock: 40,
    rating: 4.4,
    reviewCount: 178,
    tags: ['everyday', 'linen', 'minimal', 'straight'],
    createdAt: '2025-03-01T10:00:00.000Z',
  },
  {
    _id: 'demo-product-7',
    name: 'Rayon Flared Kurti',
    slug: 'rayon-flared-kurti',
    description:
      'Flowing rayon flared kurti with subtle embroidery at the neckline. Easy elegance for work and outings.',
    price: 999,
    originalPrice: 1499,
    category: 'everyday-wear',
    images: ['/images/products/kurti-2.png'],
    colors: [
      { name: 'Dusty Rose', hex: '#D4A0A0' },
      { name: 'Navy', hex: '#1B2A4A' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    material: 'Premium Rayon',
    isBestseller: false,
    isFeatured: true,
    isNewArrival: false,
    stock: 60,
    rating: 4.3,
    reviewCount: 145,
    tags: ['everyday', 'rayon', 'flared', 'office'],
    createdAt: '2024-10-12T10:00:00.000Z',
  },
  {
    _id: 'demo-product-8',
    name: 'Ikat Print Kurta',
    slug: 'ikat-print-kurta',
    description:
      'Contemporary ikat print kurta in breathable cotton blend. A modern take on traditional craftsmanship.',
    price: 1499,
    originalPrice: 1999,
    category: 'everyday-wear',
    images: ['/images/products/kurti-1.png'],
    colors: [
      { name: 'Indigo', hex: '#4B0082' },
      { name: 'Rust', hex: '#B7410E' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    material: 'Cotton Blend',
    isBestseller: false,
    isFeatured: false,
    isNewArrival: true,
    stock: 35,
    rating: 4.2,
    reviewCount: 67,
    tags: ['everyday', 'ikat', 'print', 'contemporary'],
    createdAt: '2025-03-15T10:00:00.000Z',
  },
  {
    _id: 'demo-product-9',
    name: 'Kundan Polki Necklace Set',
    slug: 'kundan-polki-necklace-set',
    description:
      'Stunning Kundan Polki necklace set with matching earrings and maang tikka. Handcrafted by master artisans.',
    price: 6999,
    originalPrice: 9999,
    category: 'statement-jewellery',
    images: ['/images/products/jewel-1.png'],
    colors: [{ name: 'Gold', hex: '#C9A96E' }],
    sizes: ['Free Size'],
    material: 'Kundan & Gold Plated',
    isBestseller: true,
    isFeatured: true,
    isNewArrival: false,
    stock: 10,
    rating: 4.9,
    reviewCount: 89,
    tags: ['jewellery', 'kundan', 'necklace', 'bridal'],
    createdAt: '2024-12-05T10:00:00.000Z',
  },
  {
    _id: 'demo-product-10',
    name: 'Temple Jhumka Earrings',
    slug: 'temple-jhumka-earrings',
    description:
      'Traditional South Indian temple jhumka earrings in antique gold finish. Adorned with ruby and emerald stones.',
    price: 2499,
    originalPrice: 3499,
    category: 'statement-jewellery',
    images: ['/images/products/jewel-2.png'],
    colors: [{ name: 'Antique Gold', hex: '#B8860B' }],
    sizes: ['Free Size'],
    material: 'Brass Gold Plated',
    isBestseller: true,
    isFeatured: true,
    isNewArrival: false,
    stock: 20,
    rating: 4.7,
    reviewCount: 212,
    tags: ['jewellery', 'jhumka', 'earrings', 'temple'],
    createdAt: '2024-11-25T10:00:00.000Z',
  },
  {
    _id: 'demo-product-11',
    name: 'Pearl Choker Set',
    slug: 'pearl-choker-set',
    description:
      'Elegant freshwater pearl choker set with gold accents. A versatile piece for both traditional and Western outfits.',
    price: 3999,
    originalPrice: 5499,
    category: 'statement-jewellery',
    images: ['/images/products/jewel-1.png'],
    colors: [{ name: 'Pearl White', hex: '#F0EAD6' }],
    sizes: ['Free Size'],
    material: 'Freshwater Pearls',
    isBestseller: false,
    isFeatured: true,
    isNewArrival: true,
    stock: 12,
    rating: 4.8,
    reviewCount: 56,
    tags: ['jewellery', 'pearl', 'choker', 'elegant'],
    createdAt: '2025-03-22T10:00:00.000Z',
  },
  {
    _id: 'demo-product-12',
    name: 'Meenakari Bangles Set',
    slug: 'meenakari-bangles-set',
    description:
      'Handpainted Meenakari bangles set of 6. Vibrant enamel work on brass base with traditional Rajasthani motifs.',
    price: 1899,
    originalPrice: 2499,
    category: 'statement-jewellery',
    images: ['/images/products/jewel-2.png'],
    colors: [{ name: 'Multi', hex: '#C9A96E' }],
    sizes: ['Free Size'],
    material: 'Brass with Meenakari',
    isBestseller: true,
    isFeatured: false,
    isNewArrival: false,
    stock: 30,
    rating: 4.6,
    reviewCount: 178,
    tags: ['jewellery', 'bangles', 'meenakari', 'rajasthani'],
    createdAt: '2024-09-30T10:00:00.000Z',
  },
];

const initialDemoReviews = [
  {
    _id: 'demo-review-1',
    customerName: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    title: 'Absolutely stunning!',
    text: 'The Maharani Silk Anarkali is even more beautiful in person. The fabric quality is exceptional and the embroidery work is flawless. Got so many compliments at the wedding!',
    productId: 'demo-product-1',
    isVerified: true,
    avatar: '👩🏻',
    createdAt: '2025-02-15T10:00:00.000Z',
  },
  {
    _id: 'demo-review-2',
    customerName: 'Ananya Reddy',
    location: 'Hyderabad',
    rating: 5,
    title: 'Perfect festive wear',
    text: 'I ordered the Chanderi kurti set for Diwali and it was perfect. The fit was exactly as described, and the dupatta is gorgeous. Will definitely order again!',
    productId: 'demo-product-2',
    isVerified: true,
    avatar: '👩🏽',
    createdAt: '2025-02-01T10:00:00.000Z',
  },
  {
    _id: 'demo-review-3',
    customerName: 'Meera Patel',
    location: 'Ahmedabad',
    rating: 4,
    title: 'Great quality, fast delivery',
    text: "The cotton printed kurti is my go-to daily wear now. So comfortable and the print hasn't faded even after multiple washes. Love it!",
    productId: 'demo-product-5',
    isVerified: true,
    avatar: '👩🏻',
    createdAt: '2025-01-20T10:00:00.000Z',
  },
  {
    _id: 'demo-review-4',
    customerName: 'Kavitha Nair',
    location: 'Kochi',
    rating: 5,
    title: 'Jewellery is breathtaking',
    text: 'The Kundan Polki set is absolutely breathtaking. It looks like real gold and the stones catch light beautifully. Worth every penny!',
    productId: 'demo-product-9',
    isVerified: true,
    avatar: '👩🏽',
    createdAt: '2025-01-12T10:00:00.000Z',
  },
  {
    _id: 'demo-review-5',
    customerName: 'Ritu Agarwal',
    location: 'Delhi',
    rating: 5,
    title: 'Radhe Boutique never disappoints',
    text: "This is my 5th order and I'm always amazed by the quality. The temple jhumkas are exquisite - handcrafted perfection. Already eyeing my next purchase!",
    productId: 'demo-product-10',
    isVerified: true,
    avatar: '👩🏻',
    createdAt: '2024-12-29T10:00:00.000Z',
  },
  {
    _id: 'demo-review-6',
    customerName: 'Sneha Iyer',
    location: 'Bangalore',
    rating: 4,
    title: 'Elegant and comfortable',
    text: 'The linen straight kurti is perfect for Bangalore weather. Minimal, elegant, and so well-stitched. The fabric quality is premium. Love the earthy tones!',
    productId: 'demo-product-6',
    isVerified: true,
    avatar: '👩🏽',
    createdAt: '2024-12-18T10:00:00.000Z',
  },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storeFilePath = path.join(__dirname, 'store.json');

const buildInitialStoreState = () => ({
  products: deepCopy(initialDemoProducts),
  reviews: deepCopy(initialDemoReviews),
  orders: [],
  orderSequence: 1,
});

const readStoreFromDisk = () => {
  try {
    if (!fs.existsSync(storeFilePath)) {
      const initialState = buildInitialStoreState();
      fs.writeFileSync(storeFilePath, JSON.stringify(initialState, null, 2), 'utf8');
      return initialState;
    }

    const raw = fs.readFileSync(storeFilePath, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      products: Array.isArray(parsed.products) ? parsed.products : deepCopy(initialDemoProducts),
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : deepCopy(initialDemoReviews),
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      orderSequence: Number(parsed.orderSequence) > 0 ? Number(parsed.orderSequence) : 1,
    };
  } catch (error) {
    console.error('Unable to read demo store file:', error.message);
    return buildInitialStoreState();
  }
};

const persistStoreToDisk = () => {
  try {
    fs.writeFileSync(
      storeFilePath,
      JSON.stringify(
        {
          products: demoProducts,
          reviews: demoReviews,
          orders: demoOrders,
          orderSequence: demoOrderSequence,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (error) {
    console.error('Unable to persist demo store file:', error.message);
  }
};

const initialStoreState = readStoreFromDisk();
let demoProducts = initialStoreState.products;
let demoReviews = initialStoreState.reviews;
let demoOrders = initialStoreState.orders;
let demoOrderSequence = initialStoreState.orderSequence;

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const buildOrderNumber = () =>
  `RB-${new Date().getFullYear()}-${String(demoOrderSequence++).padStart(4, '0')}`;

const findMutableDemoProduct = (identifier) =>
  demoProducts.find((product) => product._id === identifier || product.slug === identifier);

export const getDemoProducts = () => demoProducts.map(normalizeProductRecord);

export const getDemoProductByIdentifier = (identifier) => {
  const product = findMutableDemoProduct(identifier);
  return product ? normalizeProductRecord(product) : null;
};

export const getDemoReviews = () =>
  demoReviews
    .filter((review) => review.isVerified)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((review) => deepCopy(review));

export const addDemoReview = (reviewInput) => {
  const review = {
    _id: `demo-review-${Date.now()}`,
    isVerified: true,
    createdAt: new Date().toISOString(),
    ...deepCopy(reviewInput),
  };

  demoReviews.unshift(review);
  persistStoreToDisk();
  return deepCopy(review);
};

export const createDemoOrder = (orderInput) => {
  for (const item of orderInput.orderItems) {
    const product = findMutableDemoProduct(item.product);
    if (!product) {
      throw new Error(`Product not found for order item ${item.product}`);
    }

    if (product.stock < item.qty) {
      throw new Error(`Only ${product.stock} item(s) left in stock for ${product.name}`);
    }
  }

  for (const item of orderInput.orderItems) {
    const product = findMutableDemoProduct(item.product);
    product.stock -= item.qty;
  }

  const now = new Date().toISOString();
  const order = {
    _id: `demo-order-${Date.now()}`,
    orderNumber: buildOrderNumber(),
    status: 'Pending',
    paymentStatus: orderInput.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Awaiting Confirmation',
    createdAt: now,
    updatedAt: now,
    ...deepCopy(orderInput),
  };

  demoOrders.unshift(order);
  persistStoreToDisk();
  return deepCopy(order);
};

export const getDemoOrderById = (id) => {
  const order = demoOrders.find((entry) => entry._id === id || entry.orderNumber === id);
  return order ? deepCopy(order) : null;
};

export const getDemoOrdersByEmail = (email) =>
  demoOrders
    .filter((order) => order.customer?.email === email)
    .map((order) => deepCopy(order));

export const getAllDemoOrders = () =>
  demoOrders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((order) => deepCopy(order));

export const updateDemoOrderStatus = (id, status) => {
  const order = demoOrders.find((entry) => entry._id === id || entry.orderNumber === id);
  if (!order) {
    return null;
  }

  order.status = status || order.status;
  order.updatedAt = new Date().toISOString();
  persistStoreToDisk();
  return deepCopy(order);
};

export const createDemoProduct = (productInput) => {
  const now = new Date().toISOString();
  const baseSlug = slugify(productInput.slug || productInput.name || `product-${Date.now()}`);
  let slug = baseSlug;
  let suffix = 2;

  while (demoProducts.some((product) => product.slug === slug)) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const product = normalizeProductRecord({
    _id: `demo-product-${Date.now()}`,
    rating: 0,
    reviewCount: 0,
    isBestseller: false,
    isFeatured: false,
    isNewArrival: true,
    colors: [],
    sizes: [],
    tags: [],
    stock: 0,
    createdAt: now,
    updatedAt: now,
    ...deepCopy(productInput),
    slug,
  });

  demoProducts.unshift(product);
  persistStoreToDisk();
  return deepCopy(product);
};

export const updateDemoProduct = (id, updates) => {
  const productIndex = demoProducts.findIndex(
    (product) => product._id === id || product.slug === id
  );

  if (productIndex === -1) {
    return null;
  }

  const currentProduct = demoProducts[productIndex];
  const baseSlug = slugify(updates.slug || updates.name || currentProduct.slug);
  let slug = baseSlug;
  let suffix = 2;

  while (
    demoProducts.some(
      (product) =>
        product._id !== currentProduct._id &&
        product.slug === slug
    )
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const updatedProduct = normalizeProductRecord({
    ...currentProduct,
    ...deepCopy(updates),
    slug,
    updatedAt: new Date().toISOString(),
  });

  demoProducts[productIndex] = updatedProduct;
  persistStoreToDisk();
  return deepCopy(updatedProduct);
};

export const deleteDemoProduct = (id) => {
  const initialLength = demoProducts.length;
  demoProducts = demoProducts.filter((product) => product._id !== id && product.slug !== id);

  if (demoProducts.length === initialLength) {
    return false;
  }

  persistStoreToDisk();
  return true;
};

export const getDemoDashboardSummary = () => {
  const totalRevenue = demoOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );
  const pendingOrders = demoOrders.filter((order) =>
    ['Pending', 'Processing'].includes(order.status)
  ).length;
  const lowStockProducts = demoProducts
    .filter((product) => Number(product.stock || 0) <= 10)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

  return {
    metrics: {
      totalProducts: demoProducts.length,
      totalOrders: demoOrders.length,
      pendingOrders,
      lowStockCount: lowStockProducts.length,
      totalRevenue,
      averageOrderValue: demoOrders.length ? totalRevenue / demoOrders.length : 0,
    },
    recentOrders: demoOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((order) => deepCopy(order)),
    lowStockProducts: lowStockProducts.slice(0, 6).map((product) => normalizeProductRecord(product)),
    recentProducts: demoProducts
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 6)
      .map((product) => normalizeProductRecord(product)),
  };
};
