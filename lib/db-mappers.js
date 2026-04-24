import { normalizeProductRecord } from '../data/demoStore.js';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const mapProductRowToApi = (row) => {
  if (!row) {
    return null;
  }

  return normalizeProductRecord({
    _id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: toNumber(row.price),
    originalPrice: row.original_price == null ? undefined : toNumber(row.original_price),
    category: row.category,
    subcategory: row.subcategory || undefined,
    images: Array.isArray(row.images) ? row.images : [],
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    material: row.material || '',
    isBestseller: Boolean(row.is_bestseller),
    isFeatured: Boolean(row.is_featured),
    isNewArrival: Boolean(row.is_new_arrival),
    stock: toNumber(row.stock, 0),
    rating: toNumber(row.rating, 0),
    reviewCount: toNumber(row.review_count, 0),
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export const mapProductPayloadToRow = (payload) => ({
  name: payload.name,
  slug: payload.slug,
  description: payload.description,
  price: payload.price,
  original_price: payload.originalPrice ?? null,
  category: payload.category,
  subcategory: payload.subcategory ?? null,
  images: payload.images || [],
  colors: payload.colors || [],
  sizes: payload.sizes || [],
  material: payload.material || '',
  is_bestseller: Boolean(payload.isBestseller),
  is_featured: Boolean(payload.isFeatured),
  is_new_arrival: Boolean(payload.isNewArrival),
  stock: payload.stock ?? 0,
  rating: payload.rating ?? 0,
  review_count: payload.reviewCount ?? 0,
  tags: payload.tags || [],
  updated_at: new Date().toISOString(),
});

export const mapUserRowToApi = (row, { includePassword = false } = {}) => {
  if (!row) {
    return null;
  }

  const mapped = {
    _id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role || 'user',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includePassword) {
    mapped.password = row.password;
  }

  return mapped;
};

export const mapOrderRowToApi = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    user: row.user_id,
    orderNumber: row.order_number,
    customer: row.customer || {},
    orderItems: Array.isArray(row.order_items) ? row.order_items : [],
    shippingAddress: row.shipping_address || {},
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentResult: row.payment_result || null,
    paidAt: row.paid_at,
    itemsPrice: toNumber(row.items_price),
    taxPrice: toNumber(row.tax_price),
    shippingPrice: toNumber(row.shipping_price),
    totalPrice: toNumber(row.total_price),
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapReviewRowToApi = (row, product = null) => {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    customerName: row.customer_name,
    location: row.location,
    rating: toNumber(row.rating, 0),
    title: row.title,
    text: row.text,
    productId: product
      ? {
          _id: product.id,
          name: product.name,
        }
      : row.product_id,
    isVerified: Boolean(row.is_verified),
    avatar: row.avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapReviewPayloadToRow = (payload) => ({
  customer_name: payload.customerName,
  location: payload.location || null,
  rating: payload.rating,
  title: payload.title || null,
  text: payload.text,
  product_id: payload.productId || null,
  is_verified: payload.isVerified !== false,
  avatar: payload.avatar || null,
  updated_at: new Date().toISOString(),
});

export const mapOrderPayloadToRow = (payload) => ({
  user_id: payload.user || null,
  order_number: payload.orderNumber,
  customer: payload.customer,
  order_items: payload.orderItems,
  shipping_address: payload.shippingAddress,
  payment_method: payload.paymentMethod,
  payment_status: payload.paymentStatus,
  payment_result: payload.paymentResult || null,
  paid_at: payload.paidAt || null,
  items_price: payload.itemsPrice,
  tax_price: payload.taxPrice,
  shipping_price: payload.shippingPrice,
  total_price: payload.totalPrice,
  status: payload.status,
  notes: payload.notes || '',
  updated_at: new Date().toISOString(),
});
