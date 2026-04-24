import express from 'express';
import {
  getDemoProductByIdentifier,
  getDemoProducts,
} from '../data/demoStore.js';
import { mapProductRowToApi } from '../lib/db-mappers.js';
import { getSupabase, isDatabaseReady } from '../lib/supabase.js';

const router = express.Router();

const databaseReady = () => isDatabaseReady() && Boolean(getSupabase());

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sortColumnMap = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  price: 'price',
  rating: 'rating',
  stock: 'stock',
  name: 'name',
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const filterDemoProducts = (products, query) => {
  const {
    category,
    sort = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 12,
    minPrice,
    maxPrice,
    search,
    bestseller,
    featured
  } = query;

  let filtered = [...products];

  if (category) filtered = filtered.filter((product) => product.category === category);
  if (bestseller === 'true') filtered = filtered.filter((product) => product.isBestseller);
  if (featured === 'true') filtered = filtered.filter((product) => product.isFeatured);
  if (minPrice) filtered = filtered.filter((product) => product.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter((product) => product.price <= Number(maxPrice));
  if (search) {
    const searchTerm = search.toLowerCase();
    filtered = filtered.filter((product) =>
      [product.name, product.description, ...(product.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  filtered.sort((a, b) => {
    const multiplier = order === 'asc' ? 1 : -1;
    const aValue = a[sort];
    const bValue = b[sort];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }

    return ((aValue ?? 0) > (bValue ?? 0) ? 1 : -1) * multiplier;
  });

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const total = filtered.length;
  const start = (pageNumber - 1) * pageSize;

  return {
    products: filtered.slice(start, start + pageSize),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  };
};

// GET all products with filtering, sorting, pagination
router.get('/', async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(filterDemoProducts(getDemoProducts(), req.query));
    }

    const supabase = getSupabase();

    const {
      category,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      search,
      bestseller,
      featured
    } = req.query;

    const pageNumber = parsePositiveNumber(page, 1);
    const pageSize = parsePositiveNumber(limit, 12);
    const offset = (pageNumber - 1) * pageSize;
    const sortColumn = sortColumnMap[sort] || 'created_at';

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (bestseller === 'true') query = query.eq('is_bestseller', true);
    if (featured === 'true') query = query.eq('is_featured', true);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));
    if (search) {
      const term = `%${String(search).trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},material.ilike.${term}`);
    }

    const { data: rows, error, count } = await query
      .order(sortColumn, { ascending: order === 'asc' })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    const products = (rows || []).map(mapProductRowToApi);
    const total = Number(count || 0);

    if (total === 0) {
      return res.json(filterDemoProducts(getDemoProducts(), req.query));
    }

    res.json({
      products,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    res.json(filterDemoProducts(getDemoProducts(), req.query));
  }
});

// GET bestsellers
router.get('/bestsellers', async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(getDemoProducts().filter((product) => product.isBestseller).slice(0, 8));
    }

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_bestseller', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      throw error;
    }

    const normalizedProducts = (rows || []).map(mapProductRowToApi);
    res.json(
      normalizedProducts.length > 0
        ? normalizedProducts
        : getDemoProducts().filter((product) => product.isBestseller).slice(0, 8)
    );
  } catch (error) {
    res.json(getDemoProducts().filter((product) => product.isBestseller).slice(0, 8));
  }
});

// GET featured collections
router.get('/featured', async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(getDemoProducts().filter((product) => product.isFeatured).slice(0, 12));
    }

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      throw error;
    }

    const normalizedProducts = (rows || []).map(mapProductRowToApi);
    res.json(
      normalizedProducts.length > 0
        ? normalizedProducts
        : getDemoProducts().filter((product) => product.isFeatured).slice(0, 12)
    );
  } catch (error) {
    res.json(getDemoProducts().filter((product) => product.isFeatured).slice(0, 12));
  }
});

// GET single product
router.get('/:identifier', async (req, res) => {
  try {
    if (!databaseReady()) {
      const product = getDemoProductByIdentifier(req.params.identifier);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json(product);
    }

    const supabase = getSupabase();

    let query = supabase.from('products').select('*').limit(1);
    if (UUID_PATTERN.test(req.params.identifier)) {
      query = query.or(`id.eq.${req.params.identifier},slug.eq.${req.params.identifier}`);
    } else {
      query = query.eq('slug', req.params.identifier);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw error;
    }

    const product = mapProductRowToApi(rows?.[0] || null);
    if (!product) {
      const fallbackProduct = getDemoProductByIdentifier(req.params.identifier);
      if (!fallbackProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json(fallbackProduct);
    }

    res.json(product);
  } catch (error) {
    const fallbackProduct = getDemoProductByIdentifier(req.params.identifier);
    if (!fallbackProduct) {
      return res.status(500).json({ error: error.message });
    }

    res.json(fallbackProduct);
  }
});

export default router;
