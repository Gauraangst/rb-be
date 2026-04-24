import {
  createDemoProduct,
  deleteDemoProduct,
  getAllDemoOrders,
  getDemoDashboardSummary,
  getDemoProducts,
  getDemoReviews,
  updateDemoOrderStatus,
  updateDemoProduct,
} from '../data/demoStore.js';
import {
  mapOrderRowToApi,
  mapProductPayloadToRow,
  mapProductRowToApi,
  mapReviewRowToApi,
} from '../lib/db-mappers.js';
import { getSupabase, isDatabaseReady } from '../lib/supabase.js';

const PRODUCT_CATEGORIES = ['festive-kurtis', 'everyday-wear', 'statement-jewellery'];
const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const databaseReady = () => isDatabaseReady() && Boolean(getSupabase());

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const toBoolean = (value) => value === true || value === 'true' || value === 'on' || value === 1;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const sanitizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizeColors = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => ({
      name: String(entry?.name || '').trim(),
      hex: String(entry?.hex || '').trim(),
    }))
    .filter((entry) => entry.name && entry.hex);
};

const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = slugify(baseSlug) || `product-${Date.now()}`;
  let suffix = 2;

  if (!databaseReady()) {
    const products = getDemoProducts();
    while (products.some((product) => product._id !== excludeId && product.slug === slug)) {
      slug = `${slugify(baseSlug)}-${suffix++}`;
    }
    return slug;
  }

  const supabase = getSupabase();

  while (true) {
    const { data: existingRow, error } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!existingRow || existingRow.id === excludeId) {
      return slug;
    }

    slug = `${slugify(baseSlug)}-${suffix++}`;
  }
};

const normalizeProductPayload = async (input, existingProduct = null) => {
  const name = String(input.name || '').trim();
  const description = String(input.description || '').trim();
  const category = PRODUCT_CATEGORIES.includes(input.category)
    ? input.category
    : PRODUCT_CATEGORIES[0];

  if (!name) {
    throw new Error('Product name is required');
  }

  if (!description) {
    throw new Error('Product description is required');
  }

  const slug = await ensureUniqueSlug(input.slug || name, existingProduct?._id || null);
  const images = sanitizeStringArray(input.images);
  const sizes = sanitizeStringArray(input.sizes).filter((size) => PRODUCT_SIZES.includes(size));
  const colors = sanitizeColors(input.colors);
  const tags = sanitizeStringArray(input.tags);
  const price = toNumber(input.price, Number.NaN);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Product price must be greater than 0');
  }

  return {
    name,
    slug,
    description,
    price,
    originalPrice: toOptionalNumber(input.originalPrice),
    category,
    subcategory: String(input.subcategory || '').trim() || undefined,
    images: images.length ? images : [existingProduct?.images?.[0] || '/images/products/kurti-1.png'],
    colors,
    sizes,
    material: String(input.material || '').trim() || 'Premium Fabric',
    isBestseller: toBoolean(input.isBestseller),
    isFeatured: toBoolean(input.isFeatured),
    isNewArrival: toBoolean(input.isNewArrival),
    stock: Math.max(0, toNumber(input.stock, 0)),
    rating: existingProduct?.rating || 0,
    reviewCount: existingProduct?.reviewCount || 0,
    tags,
  };
};

const filterProducts = (products, search = '') => {
  if (!search) {
    return products;
  }

  const searchTerm = search.toLowerCase();
  return products.filter((product) =>
    [product.name, product.description, product.material, ...(product.tags || [])]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm)
  );
};

const findOrderRow = async (identifier) => {
  const supabase = getSupabase();

  let query = supabase.from('orders').select('*').limit(1);
  if (UUID_PATTERN.test(identifier)) {
    query = query.or(`id.eq.${identifier},order_number.eq.${identifier}`);
  } else {
    query = query.eq('order_number', identifier);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data?.[0] || null;
};

export const getAdminDashboard = async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(getDemoDashboardSummary());
    }

    const supabase = getSupabase();

    const [productsResult, ordersResult] = await Promise.all([
      supabase.from('products').select('*').order('updated_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    if (productsResult.error) {
      throw productsResult.error;
    }

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    const products = (productsResult.data || []).map(mapProductRowToApi);
    const orders = (ordersResult.data || []).map(mapOrderRowToApi);

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const lowStockCandidates = products
      .filter((product) => Number(product.stock || 0) <= 10)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

    res.json({
      metrics: {
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((order) => ['Pending', 'Processing'].includes(order.status)).length,
        lowStockCount: lowStockCandidates.length,
        totalRevenue,
        averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
      },
      recentOrders: orders.slice(0, 5),
      lowStockProducts: lowStockCandidates.slice(0, 6),
      recentProducts: products.slice(0, 6),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load admin dashboard' });
  }
};

export const getAdminProducts = async (req, res) => {
  try {
    const { search = '' } = req.query;

    if (!databaseReady()) {
      return res.json(filterProducts(getDemoProducts(), search));
    }

    const supabase = getSupabase();
    let query = supabase.from('products').select('*');

    if (search) {
      const term = `%${String(search).trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},material.ilike.${term}`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    const products = (data || []).map(mapProductRowToApi);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load products' });
  }
};

export const createAdminProduct = async (req, res) => {
  try {
    const payload = await normalizeProductPayload(req.body);

    if (!databaseReady()) {
      const product = createDemoProduct(payload);
      return res.status(201).json(product);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .insert(mapProductPayloadToRow(payload))
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(mapProductRowToApi(data));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to create product' });
  }
};

export const updateAdminProduct = async (req, res) => {
  try {
    if (!databaseReady()) {
      const existingProduct = getDemoProducts().find(
        (product) => product._id === req.params.id || product.slug === req.params.id
      );

      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const payload = await normalizeProductPayload(req.body, existingProduct);
      const updatedProduct = updateDemoProduct(req.params.id, payload);
      return res.json(updatedProduct);
    }

    const supabase = getSupabase();

    let findQuery = supabase.from('products').select('*').limit(1);
    if (UUID_PATTERN.test(req.params.id)) {
      findQuery = findQuery.eq('id', req.params.id);
    } else {
      findQuery = findQuery.eq('slug', req.params.id);
    }

    const { data: rows, error: findError } = await findQuery;
    if (findError) {
      throw findError;
    }

    const existingRow = rows?.[0];
    if (!existingRow) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingProduct = mapProductRowToApi(existingRow);
    const payload = await normalizeProductPayload(req.body, existingProduct);

    const { data: updatedRow, error: updateError } = await supabase
      .from('products')
      .update(mapProductPayloadToRow(payload))
      .eq('id', existingRow.id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json(mapProductRowToApi(updatedRow));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to update product' });
  }
};

export const deleteAdminProduct = async (req, res) => {
  try {
    if (!databaseReady()) {
      const deleted = deleteDemoProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.json({ success: true });
    }

    const supabase = getSupabase();
    let findQuery = supabase.from('products').select('id').limit(1);

    if (UUID_PATTERN.test(req.params.id)) {
      findQuery = findQuery.eq('id', req.params.id);
    } else {
      findQuery = findQuery.eq('slug', req.params.id);
    }

    const { data: rows, error: findError } = await findQuery;
    if (findError) {
      throw findError;
    }

    const product = rows?.[0];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);
    if (deleteError) {
      throw deleteError;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to delete product' });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(getAllDemoOrders());
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json((data || []).map(mapOrderRowToApi));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load orders' });
  }
};

export const updateAdminOrder = async (req, res) => {
  try {
    const nextStatus = String(req.body.status || '').trim();
    if (!nextStatus) {
      return res.status(400).json({ message: 'Order status is required' });
    }

    if (!databaseReady()) {
      const updatedOrder = updateDemoOrderStatus(req.params.id, nextStatus);
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.json(updatedOrder);
    }

    const order = await findOrderRow(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const supabase = getSupabase();
    const { data: updatedOrderRow, error } = await supabase
      .from('orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.json(mapOrderRowToApi(updatedOrderRow));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to update order' });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(getDemoReviews());
    }

    const supabase = getSupabase();
    const { data: reviewRows, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (reviewsError) {
      throw reviewsError;
    }

    const productIds = [...new Set((reviewRows || []).map((row) => row.product_id).filter(Boolean))];
    let productMap = new Map();

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (!productsError) {
        productMap = new Map((products || []).map((product) => [product.id, product]));
      }
    }

    const reviews = (reviewRows || []).map((row) =>
      mapReviewRowToApi(row, productMap.get(row.product_id) || null)
    );

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load reviews' });
  }
};
